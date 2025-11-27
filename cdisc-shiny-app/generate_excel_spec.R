# Generate Excel Specification from YAML
library(openxlsx)
library(dplyr)

generate_excel_spec <- function(spec) {
  wb <- createWorkbook()

  # 1. Overview Sheet
  addWorksheet(wb, "Overview")
  overview_data <- data.frame(
    Dataset = sapply(spec$datasets, function(x) x$name),
    Description = sapply(spec$datasets, function(x) x$title %||% ""),
    Class = sapply(spec$datasets, function(x) x$type),
    Structure = sapply(spec$datasets, function(x) ifelse(isTRUE(x$one_row_per_subject), "One Record per Subject", "One Record per Subject per Visit/Event")),
    Keys = sapply(spec$datasets, function(x) paste(x$join_keys %||% "", collapse = ", ")),
    stringsAsFactors = FALSE
  )
  writeDataTable(wb, "Overview", overview_data, tableStyle = "TableStyleMedium2")
  setColWidths(wb, "Overview", cols = 1:5, widths = "auto")

  # 2. Variables Sheet
  addWorksheet(wb, "Variables")

  all_vars <- list()
  for (ds in spec$datasets) {
    for (col in ds$columns) {
      all_vars[[length(all_vars) + 1]] <- data.frame(
        Dataset = ds$name,
        Variable = col$name,
        Label = col$label %||% "",
        Type = col$type %||% "",
        Length = col$length %||% "",
        Format = col$format %||% "",
        Derivation = col$derivation$description %||% "",
        Logic = col$derivation$logic %||% "",
        Source = paste(col$derivation$sources %||% "", collapse = ", "),
        Comments = col$comment %||% "",
        stringsAsFactors = FALSE
      )
    }
  }

  if (length(all_vars) > 0) {
    vars_data <- do.call(rbind, all_vars)
    writeDataTable(wb, "Variables", vars_data, tableStyle = "TableStyleMedium2")
    setColWidths(wb, "Variables", cols = 1:10, widths = c(10, 10, 30, 10, 10, 15, 40, 40, 20, 30))
  }

  # 3. Change Log Sheet
  addWorksheet(wb, "Change Log")
  change_log_data <- data.frame(
    Version = character(),
    Date = character(),
    Author = character(),
    Description = character(),
    stringsAsFactors = FALSE
  )
  # Add a dummy row if empty to show structure
  change_log_data[1, ] <- c("1.0", format(Sys.Date(), "%Y-%m-%d"), "System", "Initial generation")

  writeDataTable(wb, "Change Log", change_log_data, tableStyle = "TableStyleMedium2")
  setColWidths(wb, "Change Log", cols = 1:4, widths = c(10, 15, 20, 50))

  return(wb)
}

# Helper for null coalescing
`%||%` <- function(x, y) if (is.null(x)) y else x
