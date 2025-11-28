# Shiny-compatible ADaM Generator
# Accepts a list of data frames and a parsed YAML spec object.
# Returns a list of generated ADaM data frames.

library(dplyr)
library(stringr)
library(arrow)
library(readr)

library(readr)

# Helper function to impute partial dates
impute_dtc <- function(dtc) {
  # Ensure character
  dtc <- as.character(dtc)
  # Handle YYYY-MM-DD (keep as is, but validate)
  res <- as.Date(dtc, format = "%Y-%m-%d")

  # Handle YYYY-MM
  mask_ym <- is.na(res) & nchar(dtc) == 7
  res[mask_ym] <- as.Date(paste0(dtc[mask_ym], "-01"), format = "%Y-%m-%d")

  # Handle YYYY
  mask_y <- is.na(res) & nchar(dtc) == 4
  res[mask_y] <- as.Date(paste0(dtc[mask_y], "-01-01"), format = "%Y-%m-%d")

  return(res)
}

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
  join_warnings <- list()

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
          srcs <- sapply(col$derivation$sources, function(s) str_split(s, "\\.")[[1]][1])
          return(srcs[!srcs %in% c("Unknown", "undefined", ds_spec$name)])
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

          rows_before <- nrow(merged_data)

          if (length(by_clause) > 0) {
            merged_data <- left_join(merged_data, src_data, by = by_clause)
          } else {
            log_msg(paste("No matching join keys found between", sources[1], "and", src_name), type = "WARNING")
            merged_data <- cross_join(merged_data, src_data)
          }

          rows_after <- nrow(merged_data)

          if (rows_after > rows_before) {
            msg <- paste("Join between", sources[1], "and", src_name, "resulted in row expansion (1:N or M:N). Rows increased from", rows_before, "to", rows_after)
            log_msg(msg, type = "WARNING")
            join_warnings[[length(join_warnings) + 1]] <- list(
              target_dataset = ds_spec$name,
              source_1 = sources[1],
              source_2 = src_name,
              message = msg
            )
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
          # Determine grouping keys: Variable-level > Dataset-level > None
          grouping_keys <- NULL
          if (!is.null(col$derivation$group_by)) {
            grouping_keys <- unlist(col$derivation$group_by)
          } else if (!is.null(ds_spec$group_keys)) {
            grouping_keys <- unlist(ds_spec$group_keys)
          }

          # Apply grouping if keys exist
          # Note: This logic needs to be applied carefully.
          # If we are already grouped by dataset keys, we might need to ungroup and regroup.
          # For simplicity in this loop, we assume the base grouping is sufficient unless variable-level is specified.

          # Actually, the previous logic I wrote for variable-level grouping was inside the loop but didn't handle the pre-existing group_by well.
          # Let's refine it.

          tryCatch(
            {
              # If variable has specific grouping, use it
              if (!is.null(col$derivation$group_by)) {
                g_keys <- unlist(col$derivation$group_by)
                # Map to internal column names (Source_Variable)
                # This is tricky because we renamed everything.
                # We need to find the columns that correspond to these keys.
                # Assuming keys are from the base dataset (first source)
                g_cols <- paste(sources[1], g_keys, sep = "_")
                g_cols <- g_cols[g_cols %in% colnames(merged_data)]

                if (length(g_cols) > 0) {
                  merged_data <- merged_data %>%
                    ungroup() %>%
                    group_by(across(all_of(g_cols))) %>%
                    mutate(!!sym(col$name) := !!rlang::parse_expr(col$derivation$logic)) %>%
                    ungroup()

                  # Restore default grouping if needed
                  if (length(group_cols) > 0) {
                    merged_data <- merged_data %>% group_by(across(all_of(group_cols)))
                  }
                } else {
                  # Fallback if keys not found
                  merged_data <- merged_data %>% mutate(!!sym(col$name) := !!rlang::parse_expr(col$derivation$logic))
                }
              } else {
                # Use existing grouping
                merged_data <- merged_data %>% mutate(!!sym(col$name) := !!rlang::parse_expr(col$derivation$logic))
              }
            },
            error = function(e) {
              log_msg(paste("Error parsing/evaluating logic for", col$name, ":", e$message), type = "ERROR")
            }
          )
        } else {
          # Initialize empty/NA if no logic
          # merged_data <- merged_data %>% mutate(!!sym(col$name) := NA)
          # Skip initialization to avoid issues, or init as NA
        }
      }

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
      # Only select columns that exist
      final_cols <- final_cols[final_cols %in% colnames(merged_data)]

      final_data <- merged_data %>% select(all_of(final_cols))

      generated_datasets[[ds_spec$name]] <- final_data
      log_msg(paste("Successfully generated", ds_spec$name, "with", nrow(final_data), "rows."))
    }
  }

  log_msg("ADaM generation complete.")
  return(list(datasets = generated_datasets, warnings = join_warnings))
}
