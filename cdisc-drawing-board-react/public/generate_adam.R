# Universal ADaM Generator Script
# This script reads a YAML specification and generates ADaM datasets using dplyr.

library(yaml)
library(dplyr)
library(readr)
library(stringr)
library(arrow)

generate_adam <- function(spec_file, data_dir = ".") {
  # Load Specification
  spec <- yaml::read_yaml(spec_file)

  # Placeholder for datasets (in a real scenario, these would be loaded from files)
  # For demonstration, we assume 'data_dir' contains CSVs named like DM.csv, AE.csv, etc.
  datasets_env <- new.env()

  # Function to load dataset
  load_dataset <- function(name) {
    if (exists(name, envir = datasets_env)) {
      return(get(name, envir = datasets_env))
    }
    file_path <- file.path(data_dir, paste0(name, ".csv"))
    if (file.exists(file_path)) {
      message(paste("Loading", name, "from", file_path))
      ds <- read_csv(file_path, show_col_types = FALSE)
      assign(name, ds, envir = datasets_env)
      return(ds)
    } else {
      warning(paste("Dataset", name, "not found."))
      return(NULL)
    }
  }

  # Process each dataset in the spec
  for (ds_spec in spec$datasets) {
    if (ds_spec$type == "ADaM") {
      message(paste("Generating", ds_spec$name, "..."))

      # 1. Identify Source Datasets
      sources <- unique(unlist(lapply(ds_spec$columns, function(col) {
        if (!is.null(col$derivation$sources)) {
          return(sapply(col$derivation$sources, function(s) str_split(s, "\\.")[[1]][1]))
        }
        return(NULL)
      })))

      if (length(sources) == 0) {
        warning(paste("No sources defined for", ds_spec$name))
        next
      }

      # 2. Join Source Datasets
      # We assume the first source is the base and others are joined
      # In a real universal script, logic for determining the base dataset might be more complex
      # Here we assume the dataset with the most keys or the first one is the base.

      base_ds_name <- sources[1]
      base_ds <- load_dataset(base_ds_name)

      if (is.null(base_ds)) next

      # Rename columns in base dataset to include prefix if needed for clarity in joins,
      # but usually we keep them as is and rename only conflicting ones or rename all to Source_Col format.
      # The spec expects 'DM_USUBJID', so we should rename columns in the source datasets before joining.

      prepare_source <- function(name) {
        ds <- load_dataset(name)
        if (is.null(ds)) {
          return(NULL)
        }
        # Rename all columns to Dataset_Column format
        colnames(ds) <- paste(name, colnames(ds), sep = "_")
        return(ds)
      }

      # Prepare all sources
      prepared_sources <- lapply(sources, prepare_source)
      names(prepared_sources) <- sources

      # Start with the first source
      merged_data <- prepared_sources[[1]]

      # Join other sources
      if (length(sources) > 1) {
        for (i in 2:length(sources)) {
          src_name <- sources[i]
          src_data <- prepared_sources[[src_name]]

          # Determine join keys
          # We use the join_keys defined in the ADaM spec to join sources.
          # We assume sources have these keys (prefixed).
          keys <- ds_spec$join_keys

          # Map keys to prefixed versions
          # e.g. USUBJID -> DM_USUBJID and EX_USUBJID
          # This assumes sources share these keys.

          # Construct 'by' argument
          by_clause <- c()
          for (k in keys) {
            left_key <- paste(sources[1], k, sep = "_") # Assuming we join to the accumulated data which has first source's prefixes
            right_key <- paste(src_name, k, sep = "_")

            # Check if keys exist
            if (left_key %in% colnames(merged_data) && right_key %in% colnames(src_data)) {
              by_clause[left_key] <- right_key
            }
          }

          if (length(by_clause) > 0) {
            merged_data <- left_join(merged_data, src_data, by = by_clause)
          } else {
            # Cartesian join if no keys? Or warning.
            warning(paste("No matching join keys found between", sources[1], "and", src_name))
            merged_data <- cross_join(merged_data, src_data)
          }
        }
      }

      # 3. Group by Join Keys
      # The keys in merged_data are prefixed (e.g. DM_USUBJID).
      # We need to group by these columns.
      group_cols <- paste(sources[1], ds_spec$join_keys, sep = "_")
      group_cols <- group_cols[group_cols %in% colnames(merged_data)]

      if (length(group_cols) > 0) {
        merged_data <- merged_data %>% group_by(across(all_of(group_cols)))
      }

      # 4. Apply Derivations
      # Construct mutate expressions
      mutate_exprs <- list()

      for (col in ds_spec$columns) {
        if (!is.null(col$derivation$logic) && col$derivation$logic != "") {
          # The logic string from spec (e.g. "min(EX_EXSTDTC)") should be valid R expression
          # involving the prefixed column names we created.
          mutate_exprs[[col$name]] <- rlang::parse_expr(col$derivation$logic)
        } else {
          mutate_exprs[[col$name]] <- NA
        }
      }

      # Apply mutate
      # We use rlang::eval_tidy to evaluate expressions
      # But simpler is to build a text string for mutate and parse it, or use rlang::!!!

      merged_data <- merged_data %>% mutate(!!!mutate_exprs)

      # 5. Handle One Row Per Subject
      if (isTRUE(ds_spec$one_row_per_subject)) {
        merged_data <- merged_data %>%
          slice(1) %>%
          ungroup()
      } else {
        merged_data <- merged_data %>% ungroup()
      }

      # 6. Select Columns
      final_cols <- sapply(ds_spec$columns, function(x) x$name)
      # Check which columns exist
      final_cols <- final_cols[final_cols %in% colnames(merged_data)]

      final_data <- merged_data %>% select(all_of(final_cols))

      # Save or Store
      assign(ds_spec$name, final_data, envir = datasets_env)

      # Save as Parquet
      parquet_path <- file.path(data_dir, paste0(ds_spec$name, ".parquet"))
      arrow::write_parquet(final_data, parquet_path)
      message(paste("Saved", ds_spec$name, "to", parquet_path))

      print(head(final_data))
    }
  }

  return(as.list(datasets_env))
}

# Example Usage:
# generate_adam("cdisc-mapping-spec.yaml", data_dir = "path/to/csvs")
