library(shiny)
library(yaml)
library(DiagrammeR)
library(DT)
library(shinythemes)
library(readr)
library(arrow)

source("generate_adam_shiny.R")
source("generate_excel_spec.R")
source("generate_prompt.R")

# Increase max upload size to 100MB
options(shiny.maxRequestSize = 100 * 1024^2)

ui <- fluidPage(
  theme = shinytheme("flatly"),
  titlePanel("CDISC ADaM Generator"),
  sidebarLayout(
    sidebarPanel(
      h4("1. Specification"),
      fileInput("spec_file", "Upload YAML Spec", accept = c(".yaml", ".yml")),
      textAreaInput("spec_text", "Or Paste YAML Spec Here", height = "200px"),
      h4("2. Source Data (SDTM)"),
      fileInput("sdtm_files", "Upload SDTM Datasets (CSV/Parquet)", multiple = TRUE, accept = c(".csv", ".parquet")),
      uiOutput("map_ui"),
      h4("3. Configuration"),
      selectInput("output_format", "Output Format", choices = c("CSV", "Parquet", "RDS")),
      actionButton("generate_btn", "Generate ADaM Datasets", class = "btn-primary btn-block"),
      br(), br(),
      downloadButton("download_btn", "Download Results (Zip)", class = "btn-success btn-block"),
      br(),
      downloadButton("download_spec_btn", "Download Spec (Excel)", class = "btn-warning btn-block")
    ),
    mainPanel(
      tabsetPanel(
        tabPanel(
          "Visualization",
          div(
            style = "height: 600px; overflow: auto;",
            grVizOutput("diagram", height = "600px")
          )
        ),
        tabPanel(
          "Spec Explorer",
          br(),
          sidebarLayout(
            sidebarPanel(
              width = 3,
              h4("Datasets"),
              uiOutput("explorer_ds_list"),
              actionButton("add_ds_btn", "Add Dataset", class = "btn-success btn-sm btn-block"),
              actionButton("remove_ds_btn", "Remove Selected", class = "btn-danger btn-sm btn-block")
            ),
            mainPanel(
              width = 9,
              uiOutput("explorer_ds_details")
            )
          )
        ),
        tabPanel(
          "LLM Prompt",
          br(),
          h4("Generate Prompt for Spec Creation"),
          p("Select the ADaM datasets you want to create and the desired complexity. The app will generate a prompt including your loaded SDTM structures."),
          fluidRow(
            column(
              4,
              checkboxGroupInput("target_adams", "Target ADaM Datasets:",
                choices = c("ADSL", "ADAE", "ADLB", "ADVS", "ADMH", "ADCM", "ADEX", "ADDS"),
                selected = c("ADSL")
              )
            ),
            column(
              4,
              radioButtons("complexity", "Complexity Level:",
                choices = c("Low", "Medium", "High"),
                selected = "Medium"
              )
            ),
            column(
              4,
              br(),
              actionButton("gen_prompt_btn", "Generate Prompt", class = "btn-primary btn-lg")
            )
          ),
          hr(),
          div(
            style = "display: flex; justify-content: space-between; align-items: center;",
            h5("Generated Prompt (Copy and Paste to LLM):"),
            actionButton("copy_btn", "Copy to Clipboard", icon = icon("copy"), class = "btn-sm btn-default")
          ),
          textAreaInput("llm_prompt_out", NULL, width = "100%", height = "400px"),
          tags$script("
            $(document).on('click', '#copy_btn', function() {
              var copyText = document.getElementById('llm_prompt_out');
              copyText.select();
              navigator.clipboard.writeText(copyText.value).then(function() {
                alert('Prompt copied to clipboard!');
              }, function(err) {
                console.error('Async: Could not copy text: ', err);
              });
            });
          ")
        ),
        tabPanel(
          "Logs",
          div(id = "log_output", class = "log-container", htmlOutput("logs"))
        ),
        tabPanel(
          "Preview",
          br(),
          uiOutput("preview_tabs")
        )
      )
    )
  )
)

server <- function(input, output, session) {
  # Reactive values
  rv <- reactiveValues(
    spec = NULL,
    sdtm_data = list(),
    adam_data = list(),
    logs = c(),
    diagram_code = "",
    join_warnings = list()
  )

  # Log handler
  add_log <- function(msg) {
    rv$logs <- c(rv$logs, msg)
  }

  # Parse Spec
  observe({
    spec_content <- NULL
    if (!is.null(input$spec_file)) {
      spec_content <- yaml::read_yaml(input$spec_file$datapath)
    } else if (input$spec_text != "") {
      tryCatch(
        {
          spec_content <- yaml::read_yaml(text = input$spec_text)
        },
        error = function(e) {
          # Silent error while typing
        }
      )
    }

    if (!is.null(spec_content)) {
      rv$spec <- spec_content
      update_diagram()
    }
  })

  # Load SDTM Data
  observeEvent(input$sdtm_files, {
    req(input$sdtm_files)
    rv$sdtm_data <- list()
    add_log("Loading SDTM files...")

    for (i in 1:nrow(input$sdtm_files)) {
      path <- input$sdtm_files$datapath[i]
      name <- tools::file_path_sans_ext(input$sdtm_files$name[i])
      ext <- tools::file_ext(input$sdtm_files$name[i])

      tryCatch(
        {
          if (tolower(ext) == "csv") {
            df <- read_csv(path, show_col_types = FALSE)
          } else if (tolower(ext) == "parquet") {
            df <- arrow::read_parquet(path)
          } else {
            next
          }
          rv$sdtm_data[[name]] <- df
          add_log(paste("Loaded", name))
        },
        error = function(e) {
          add_log(paste("Error loading", name, ":", e$message))
        }
      )
    }
  })

  # Map UI
  output$map_ui <- renderUI({
    req(rv$sdtm_data)
    actionButton("map_btn", "Map Datasets to Domains", class = "btn-info btn-block")
  })

  # Mapping Modal
  observeEvent(input$map_btn, {
    req(rv$sdtm_data, rv$spec)

    # Get domains from spec
    domains <- c()
    for (ds in rv$spec$datasets) {
      if (ds$type == "SDTM") domains <- c(domains, ds$name)
    }

    showModal(modalDialog(
      title = "Map Uploaded Files to SDTM Domains",
      lapply(names(rv$sdtm_data), function(file_name) {
        # Try to guess domain (case insensitive match)
        selected <- NULL
        if (toupper(file_name) %in% domains) selected <- toupper(file_name)

        div(
          style = "display: flex; align-items: center; margin-bottom: 10px;",
          div(style = "width: 40%; font-weight: bold;", file_name),
          div(style = "width: 10%; text-align: center;", "->"),
          div(
            style = "width: 50%;",
            selectInput(paste0("map_", file_name), NULL, choices = c("Ignore", domains), selected = selected)
          )
        )
      }),
      footer = tagList(
        modalButton("Cancel"),
        actionButton("save_mapping", "Save Mapping", class = "btn-primary")
      )
    ))
  })

  # Save Mapping
  observeEvent(input$save_mapping, {
    req(rv$sdtm_data)
    mapped_data <- list()

    for (file_name in names(rv$sdtm_data)) {
      mapped_name <- input[[paste0("map_", file_name)]]
      if (!is.null(mapped_name) && mapped_name != "Ignore") {
        mapped_data[[mapped_name]] <- rv$sdtm_data[[file_name]]
        add_log(paste("Mapped", file_name, "to", mapped_name))
      }
    }

    rv$sdtm_data <- mapped_data
    removeModal()
    add_log("Mapping saved.")
  })

  # Update Diagram
  update_diagram <- function() {
    req(rv$spec)

    nodes <- c()
    edges <- c()

    # Create Edges
    for (ds in rv$spec$datasets) {
      if (ds$type == "ADaM") {
        sources <- unique(unlist(lapply(ds$columns, function(col) {
          if (!is.null(col$derivation$sources)) {
            sapply(col$derivation$sources, function(s) str_split(s, "\\.")[[1]][1])
          }
        })))

        # Filter out self-references and unknown
        sources <- sources[!sources %in% c("Unknown", "undefined", ds$name)]

        for (src in sources) {
          # Check for warnings
          is_warning <- FALSE
          for (w in rv$join_warnings) {
            if (w$target_dataset == ds$name && (w$source_1 == src || w$source_2 == src)) {
              is_warning <- TRUE
              break
            }
          }

          color <- ifelse(is_warning, "red", "gray")
          penwidth <- ifelse(is_warning, "2.0", "1.0")
          tooltip <- ifelse(is_warning, "Warning: 1:N Join Detected", "")

          edges <- c(edges, sprintf("  %s -> %s [color = '%s', penwidth = '%s', tooltip = '%s'];", src, ds$name, color, penwidth, tooltip))
        }
      }
    }

    graph_code <- paste0(
      "digraph {",
      "  graph [layout = dot, rankdir = LR]",
      "  node [style = filled, fillcolor = '#E0F7FA', fontname = 'Helvetica']",
      paste(nodes, collapse = "\n"),
      paste(edges, collapse = "\n"),
      "}"
    )

    rv$diagram_code <- graph_code
  }

  output$diagram <- renderGrViz({
    req(rv$diagram_code)
    grViz(rv$diagram_code)
  })

  # Generate ADaM
  observeEvent(input$generate_btn, {
    req(rv$spec, rv$sdtm_data)
    rv$logs <- c() # Clear logs
    rv$join_warnings <- list() # Clear warnings
    add_log("Starting generation...")

    tryCatch(
      {
        res <- generate_adam_shiny(rv$spec, rv$sdtm_data, log_callback = add_log)

        if (is.list(res) && "datasets" %in% names(res)) {
          rv$adam_data <- res$datasets
          rv$join_warnings <- res$warnings
        } else {
          rv$adam_data <- res
        }

        add_log("Generation finished successfully!")
        update_diagram()
      },
      error = function(e) {
        add_log(paste("Critical Error:", e$message))
      }
    )
  })

  # Logs Output
  output$logs <- renderUI({
    HTML(paste(rv$logs, collapse = "<br/>"))
  })

  # Preview Tabs
  output$preview_tabs <- renderUI({
    req(rv$adam_data)
    tabs <- lapply(names(rv$adam_data), function(name) {
      tabPanel(name, DTOutput(paste0("dt_", name)))
    })
    do.call(tabsetPanel, tabs)
  })

  # Render DataTables
  observe({
    req(rv$adam_data)
    for (name in names(rv$adam_data)) {
      local({
        local_name <- name
        output[[paste0("dt_", local_name)]] <- renderDT({
          datatable(rv$adam_data[[local_name]], options = list(pageLength = 10, scrollX = TRUE))
        })
      })
    }
  })

  # Download Handler
  output$download_btn <- downloadHandler(
    filename = function() {
      paste0("adam_datasets_", format(Sys.time(), "%Y%m%d_%H%M%S"), ".zip")
    },
    content = function(file) {
      req(rv$adam_data)
      temp_dir <- tempdir()
      files <- c()

      for (name in names(rv$adam_data)) {
        df <- rv$adam_data[[name]]
        fname <- paste0(name, ".", tolower(input$output_format))
        fpath <- file.path(temp_dir, fname)

        if (input$output_format == "CSV") {
          write_csv(df, fpath)
        } else if (input$output_format == "Parquet") {
          arrow::write_parquet(df, fpath)
        } else if (input$output_format == "RDS") {
          saveRDS(df, fpath)
        }
        files <- c(files, fpath)
      }

      zip(file, files, flags = "-j")
    }
  )

  # Download Spec Handler
  output$download_spec_btn <- downloadHandler(
    filename = function() {
      paste0("adam_spec_", format(Sys.time(), "%Y%m%d_%H%M%S"), ".xlsx")
    },
    content = function(file) {
      req(rv$spec)
      wb <- generate_excel_spec(rv$spec)
      saveWorkbook(wb, file, overwrite = TRUE)
    }
  )

  # Generate Prompt Handler
  observeEvent(input$gen_prompt_btn, {
    req(input$target_adams)

    prompt <- generate_llm_prompt(
      sdtm_data = rv$sdtm_data,
      target_adams = input$target_adams,
      complexity = input$complexity
    )

    updateTextAreaInput(session, "llm_prompt_out", value = prompt)
    add_log("LLM Prompt generated.")
  })

  # --- YAML Explorer Logic ---

  # Reactive state for selected dataset in Explorer
  rv_explorer <- reactiveValues(selected_ds = NULL)

  # Render Dataset List
  output$explorer_ds_list <- renderUI({
    req(rv$spec)
    ds_names <- sapply(rv$spec$datasets, function(x) x$name)
    selectInput("explorer_selected_ds", NULL, choices = ds_names, size = 10, selectize = FALSE)
  })

  # Update selected dataset reactive
  observeEvent(input$explorer_selected_ds, {
    rv_explorer$selected_ds <- input$explorer_selected_ds
  })

  # Render Dataset Details
  output$explorer_ds_details <- renderUI({
    req(rv$spec, rv_explorer$selected_ds)

    # Find selected dataset
    ds <- NULL
    for (d in rv$spec$datasets) {
      if (d$name == rv_explorer$selected_ds) {
        ds <- d
        break
      }
    }

    if (is.null(ds)) {
      return(h5("Select a dataset to view details."))
    }

    tagList(
      h4(paste("Dataset:", ds$name)),
      fluidRow(
        column(4, textInput("exp_ds_name", "Name", value = ds$name)),
        column(4, selectInput("exp_ds_type", "Type", choices = c("SDTM", "ADaM"), selected = ds$type)),
        column(
          4,
          if (ds$type == "ADaM") checkboxInput("exp_ds_one_row", "One Row/Subject", value = isTRUE(ds$one_row_per_subject))
        )
      ),
      if (ds$type == "ADaM") {
        fluidRow(
          column(6, textInput("exp_ds_join_keys", "Join Keys (comma-separated)", value = paste(ds$join_keys, collapse = ", "))),
          column(6, textInput("exp_ds_group_keys", "Group By Keys (comma-separated)", value = paste(ds$group_keys, collapse = ", ")))
        )
      },
      hr(),
      h5("Columns"),
      DTOutput("exp_columns_table"),
      br(),
      actionButton("add_col_btn", "Add Column", class = "btn-info btn-sm"),
      actionButton("edit_col_btn", "Edit Selected Column", class = "btn-success btn-sm"),
      actionButton("remove_col_btn", "Remove Selected Column", class = "btn-warning btn-sm"),
      br(), br(),
      actionButton("save_ds_changes", "Save Changes", class = "btn-primary")
    )
  })

  # Render Columns Table
  output$exp_columns_table <- renderDT({
    req(rv$spec, rv_explorer$selected_ds)

    # Find dataset
    ds <- NULL
    for (d in rv$spec$datasets) {
      if (d$name == rv_explorer$selected_ds) {
        ds <- d
        break
      }
    }

    if (is.null(ds)) {
      return(NULL)
    }

    # Create data frame for columns
    cols_df <- data.frame(
      Name = vapply(ds$columns, function(x) if (is.null(x$name)) "" else as.character(x$name), character(1)),
      Label = vapply(ds$columns, function(x) if (is.null(x$label)) "" else as.character(x$label), character(1)),
      Type = vapply(ds$columns, function(x) if (is.null(x$type)) "" else as.character(x$type), character(1)),
      Logic = vapply(ds$columns, function(x) if (is.null(x$derivation$logic)) "" else as.character(x$derivation$logic), character(1)),
      stringsAsFactors = FALSE
    )

    datatable(cols_df, selection = "single", options = list(dom = "t", pageLength = 100))
  })

  # Save Dataset Changes
  observeEvent(input$save_ds_changes, {
    req(rv$spec, rv_explorer$selected_ds)

    # Update spec
    for (i in seq_along(rv$spec$datasets)) {
      if (rv$spec$datasets[[i]]$name == rv_explorer$selected_ds) {
        rv$spec$datasets[[i]]$name <- input$exp_ds_name
        rv$spec$datasets[[i]]$type <- input$exp_ds_type

        if (input$exp_ds_type == "ADaM") {
          rv$spec$datasets[[i]]$one_row_per_subject <- input$exp_ds_one_row

          # Parse join keys
          keys <- trimws(strsplit(input$exp_ds_join_keys, ",")[[1]])
          keys <- keys[keys != ""]
          if (length(keys) > 0) {
            rv$spec$datasets[[i]]$join_keys <- as.list(keys)
          } else {
            rv$spec$datasets[[i]]$join_keys <- NULL
          }

          # Parse group keys
          g_keys <- trimws(strsplit(input$exp_ds_group_keys, ",")[[1]])
          g_keys <- g_keys[g_keys != ""]
          if (length(g_keys) > 0) {
            rv$spec$datasets[[i]]$group_keys <- as.list(g_keys)
          } else {
            rv$spec$datasets[[i]]$group_keys <- NULL
          }
        }

        # Update selected ds name if changed
        if (rv_explorer$selected_ds != input$exp_ds_name) {
          rv_explorer$selected_ds <- input$exp_ds_name
        }
        break
      }
    }

    updateTextAreaInput(session, "spec_text", value = yaml::as.yaml(rv$spec))
    add_log(paste("Updated dataset:", input$exp_ds_name))
    update_diagram()
  })

  # Edit Column
  observeEvent(input$edit_col_btn, {
    add_log("Edit Column button clicked.")
    if (is.null(input$exp_columns_table_rows_selected)) {
      showModal(modalDialog(
        title = "Warning",
        "Please select a column to edit.",
        easyClose = TRUE,
        footer = modalButton("Close")
      ))
      return()
    }

    req(rv$spec, rv_explorer$selected_ds)

    # Get selected row index
    idx <- input$exp_columns_table_rows_selected
    add_log(paste("Editing column at index:", idx))

    # Find dataset and column
    ds <- NULL
    col <- NULL
    for (d in rv$spec$datasets) {
      if (d$name == rv_explorer$selected_ds) {
        ds <- d
        if (idx <= length(d$columns)) {
          col <- d$columns[[idx]]
        }
        break
      }
    }

    if (is.null(col)) {
      add_log("Error: Column not found.")
      return()
    }

    showModal(modalDialog(
      title = paste("Edit Column:", col$name),
      textInput("edit_col_name", "Column Name", value = col$name),
      textInput("edit_col_label", "Label", value = ifelse(is.null(col$label), "", col$label)),
      selectInput("edit_col_type", "Type", choices = c("text", "integer", "float", "date", "datetime"), selected = col$type),
      textAreaInput("edit_col_logic", "Derivation Logic (Optional)", value = ifelse(is.null(col$derivation$logic), "", col$derivation$logic)),
      textInput("edit_col_group_by", "Group By Keys (comma-separated)", value = ifelse(is.null(col$derivation$group_by), "", paste(col$derivation$group_by, collapse = ", "))),
      footer = tagList(
        modalButton("Cancel"),
        actionButton("confirm_edit_col", "Save Changes", class = "btn-primary")
      )
    ))
  })

  observeEvent(input$confirm_edit_col, {
    req(rv$spec, rv_explorer$selected_ds, input$exp_columns_table_rows_selected, input$edit_col_name)

    idx <- input$exp_columns_table_rows_selected

    # Update spec
    for (i in seq_along(rv$spec$datasets)) {
      if (rv$spec$datasets[[i]]$name == rv_explorer$selected_ds) {
        # Update column properties
        rv$spec$datasets[[i]]$columns[[idx]]$name <- input$edit_col_name
        rv$spec$datasets[[i]]$columns[[idx]]$label <- input$edit_col_label
        rv$spec$datasets[[i]]$columns[[idx]]$type <- input$edit_col_type

        if (input$edit_col_logic != "") {
          rv$spec$datasets[[i]]$columns[[idx]]$derivation <- list(logic = input$edit_col_logic)
        } else {
          rv$spec$datasets[[i]]$columns[[idx]]$derivation <- NULL
        }

        # Parse group keys
        g_keys <- trimws(strsplit(input$edit_col_group_by, ",")[[1]])
        g_keys <- g_keys[g_keys != ""]
        if (length(g_keys) > 0) {
          if (is.null(rv$spec$datasets[[i]]$columns[[idx]]$derivation)) {
            rv$spec$datasets[[i]]$columns[[idx]]$derivation <- list()
          }
          rv$spec$datasets[[i]]$columns[[idx]]$derivation$group_by <- as.list(g_keys)
        } else {
          if (!is.null(rv$spec$datasets[[i]]$columns[[idx]]$derivation)) {
            rv$spec$datasets[[i]]$columns[[idx]]$derivation$group_by <- NULL
          }
        }
        break
      }
    }

    updateTextAreaInput(session, "spec_text", value = yaml::as.yaml(rv$spec))
    removeModal()
    add_log(paste("Updated column:", input$edit_col_name))
    update_diagram()
  })

  # Remove Column
  observeEvent(input$remove_col_btn, {
    if (is.null(input$exp_columns_table_rows_selected)) {
      showModal(modalDialog(
        title = "Warning",
        "Please select a column to remove.",
        easyClose = TRUE,
        footer = modalButton("Close")
      ))
      return()
    }

    req(rv$spec, rv_explorer$selected_ds)

    # Get selected row index (1-based from DT)
    idx <- input$exp_columns_table_rows_selected

    for (i in seq_along(rv$spec$datasets)) {
      if (rv$spec$datasets[[i]]$name == rv_explorer$selected_ds) {
        # Remove column at index
        col_name <- rv$spec$datasets[[i]]$columns[[idx]]$name
        rv$spec$datasets[[i]]$columns <- rv$spec$datasets[[i]]$columns[-idx]
        add_log(paste("Removed column:", col_name))
        break
      }
    }

    updateTextAreaInput(session, "spec_text", value = yaml::as.yaml(rv$spec))
    update_diagram()
  })

  # Add Dataset
  observeEvent(input$add_ds_btn, {
    req(rv$spec)
    new_ds <- list(
      name = "NEW_DS",
      type = "ADaM",
      columns = list(list(name = "STUDYID", type = "text"), list(name = "USUBJID", type = "text"))
    )
    rv$spec$datasets <- c(rv$spec$datasets, list(new_ds))
    rv_explorer$selected_ds <- "NEW_DS"
    updateTextAreaInput(session, "spec_text", value = yaml::as.yaml(rv$spec))
    update_diagram()
  })

  # Remove Dataset
  observeEvent(input$remove_ds_btn, {
    req(rv$spec, input$explorer_selected_ds)
    rv$spec$datasets <- Filter(function(x) x$name != input$explorer_selected_ds, rv$spec$datasets)
    rv_explorer$selected_ds <- NULL
    updateTextAreaInput(session, "spec_text", value = yaml::as.yaml(rv$spec))
    update_diagram()
  })
}

shinyApp(ui = ui, server = server)
