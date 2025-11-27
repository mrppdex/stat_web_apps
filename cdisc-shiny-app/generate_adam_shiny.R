# Shiny-compatible ADaM Generator
# Accepts a list of data frames and a parsed YAML spec object.
# Returns a list of generated ADaM data frames.

library(dplyr)
library(stringr)
library(arrow)
library(readr)

generate_adam_shiny <- function(spec, source_datasets, log_callback = NULL) {
  log_msg <- function(msg, type = "INFO") {
    formatted_msg <- paste0("[", format(Sys.time(), "%H:%M:%S"), "] [", type, "] ", msg)
    if (!is.null(log_callback)) {
      log_callback(formatted_msg)
    } else {
      message(formatted_msg)
    }
  }

  generated_datasets <- list()

  # Helper to get dataset from source or generated list
  get_dataset <- function(name) {
    if (name %in% names(generated_datasets)) {
      return(generated_datasets[[name]])
    }
    if (name %in% names(source_datasets)) {
      return(source_datasets[[name]])
    }
    return(NULL)
  }

  log_msg("Starting ADaM generation...")

  for (ds_spec in spec$datasets) {
    if (ds_spec$type == "ADaM") {
      log_msg(paste("Processing", ds_spec$name, "..."))

      # 1. Identify Source Datasets
      sources <- unique(unlist(lapply(ds_spec$columns, function(col) {
        if (!is.null(col$derivation$sources)) {
          return(sapply(col$derivation$sources, function(s) str_split(s, "\\.")[[1]][1]))
        }
        return(NULL)
      })))

      if (length(sources) == 0) {
        log_msg(paste("No sources defined for", ds_spec$name), type = "WARNING")
        next
      }

      # 2. Prepare Sources (Rename columns)
      prepared_sources <- list()
      missing_source <- FALSE

      for (src_name in sources) {
        ds <- get_dataset(src_name)
        if (is.null(ds)) {
          log_msg(paste("Source dataset", src_name, "not found for", ds_spec$name), type = "ERROR")
          missing_source <- TRUE
          break
        }
        # Rename columns to Dataset_Column format
        colnames(ds) <- paste(src_name, colnames(ds), sep = "_")
        prepared_sources[[src_name]] <- ds
      }

      if (missing_source) next

      # 3. Join Sources
      base_ds_name <- sources[1]
      merged_data <- prepared_sources[[base_ds_name]]

      if (length(sources) > 1) {
        for (i in 2:length(sources)) {
          src_name <- sources[i]
          src_data <- prepared_sources[[src_name]]
          keys <- ds_spec$join_keys

          by_clause <- c()
          for (k in keys) {
            left_key <- paste(sources[1], k, sep = "_")
            right_key <- paste(src_name, k, sep = "_")

            if (left_key %in% colnames(merged_data) && right_key %in% colnames(src_data)) {
              by_clause[left_key] <- right_key
            }
          }

          if (length(by_clause) > 0) {
            merged_data <- left_join(merged_data, src_data, by = by_clause)
          } else {
            log_msg(paste("No matching join keys found between", sources[1], "and", src_name), type = "WARNING")
            merged_data <- cross_join(merged_data, src_data)
          }
        }
      }

      # 4. Group by Join Keys or Group Keys
      if (!is.null(ds_spec$group_keys) && length(ds_spec$group_keys) > 0) {
        group_cols <- paste(sources[1], ds_spec$group_keys, sep = "_")
      } else {
        group_cols <- paste(sources[1], ds_spec$join_keys, sep = "_")
      }
      group_cols <- group_cols[group_cols %in% colnames(merged_data)]

      if (length(group_cols) > 0) {
        merged_data <- merged_data %>% group_by(across(all_of(group_cols)))
      }

      # 5. Apply Derivations
      mutate_exprs <- list()
      for (col in ds_spec$columns) {
        if (!is.null(col$derivation$logic) && col$derivation$logic != "") {
          tryCatch(
            {
              mutate_exprs[[col$name]] <- rlang::parse_expr(col$derivation$logic)
            },
            error = function(e) {
              log_msg(paste("Error parsing logic for", col$name, ":", e$message), type = "ERROR")
            }
          )
        } else {
          mutate_exprs[[col$name]] <- NA
        }
      }

      tryCatch(
        {
          merged_data <- merged_data %>% mutate(!!!mutate_exprs)
        },
        error = function(e) {
          log_msg(paste("Error applying derivations for", ds_spec$name, ":", e$message), type = "ERROR")
        }
      )

      # 6. Handle One Row Per Subject
      if (isTRUE(ds_spec$one_row_per_subject)) {
        merged_data <- merged_data %>%
          slice(1) %>%
          ungroup()
      } else {
        merged_data <- merged_data %>% ungroup()
      }

      # 7. Select Columns
      final_cols <- sapply(ds_spec$columns, function(x) x$name)
      final_cols <- final_cols[final_cols %in% colnames(merged_data)]

      final_data <- merged_data %>% select(all_of(final_cols))

      generated_datasets[[ds_spec$name]] <- final_data
      log_msg(paste("Successfully generated", ds_spec$name, "with", nrow(final_data), "rows."))
    }
  }

  log_msg("ADaM generation complete.")
  return(generated_datasets)
}
