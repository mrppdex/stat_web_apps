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
          "LLM Prompt Generator",
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
          "Log",
          verbatimTextOutput("log_output")
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
          "Preview",
          br(),
          uiOutput("dataset_tabs")
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
    diagram_code = ""
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

    for (ds in rv$spec$datasets) {
      nodes <- c(nodes, paste0(ds$name, " [label = '", ds$name, "\\n(", ds$type, ")', shape = ", ifelse(ds$type == "SDTM", "box", "oval"), "]"))

      if (ds$type == "ADaM") {
        sources <- unique(unlist(lapply(ds$columns, function(col) {
          if (!is.null(col$derivation$sources)) {
            return(sapply(col$derivation$sources, function(s) str_split(s, "\\.")[[1]][1]))
          }
          return(NULL)
        })))

        for (src in sources) {
          edges <- c(edges, paste0(src, " -> ", ds$name))
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
    add_log("Starting generation...")

    tryCatch(
      {
        rv$adam_data <- generate_adam_shiny(rv$spec, rv$sdtm_data, log_callback = add_log)
        add_log("Generation finished successfully!")
      },
      error = function(e) {
        add_log(paste("Critical Error:", e$message))
      }
    )
  })

  # Logs Output
  output$log_output <- renderText({
    paste(rv$logs, collapse = "\n")
  })

  # Preview Tabs
  output$dataset_tabs <- renderUI({
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
          column(12, textInput("exp_ds_join_keys", "Join Keys (comma separated)", value = paste(ds$join_keys, collapse = ", ")))
        )
      },
      hr(),
      h5("Columns"),
      DTOutput("exp_columns_table"),
      br(),
      actionButton("add_col_btn", "Add Column", class = "btn-info btn-sm"),
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
      Name = sapply(ds$columns, function(x) x$name),
      Label = sapply(ds$columns, function(x) ifelse(is.null(x$label), "", x$label)),
      Type = sapply(ds$columns, function(x) ifelse(is.null(x$type), "", x$type)),
      Derivation = sapply(ds$columns, function(x) ifelse(is.null(x$derivation$logic), "", x$derivation$logic)),
      stringsAsFactors = FALSE
    )

    datatable(cols_df, selection = "single", options = list(pageLength = 5, dom = "tp"))
  })

  # Save Changes (Dataset Metadata)
  observeEvent(input$save_ds_changes, {
    req(rv$spec, rv_explorer$selected_ds)

    # Update spec
    new_spec <- rv$spec
    for (i in seq_along(new_spec$datasets)) {
      if (new_spec$datasets[[i]]$name == rv_explorer$selected_ds) {
        # Update metadata
        new_spec$datasets[[i]]$name <- input$exp_ds_name
        new_spec$datasets[[i]]$type <- input$exp_ds_type
        if (input$exp_ds_type == "ADaM") {
          new_spec$datasets[[i]]$one_row_per_subject <- input$exp_ds_one_row
          # Parse join keys
          keys <- trimws(strsplit(input$exp_ds_join_keys, ",")[[1]])
          new_spec$datasets[[i]]$join_keys <- keys[keys != ""]
        }

        # Update selection if name changed
        if (rv_explorer$selected_ds != input$exp_ds_name) {
          rv_explorer$selected_ds <- input$exp_ds_name
        }
        break
      }
    }

    rv$spec <- new_spec
    # Update text area
    updateTextAreaInput(session, "spec_text", value = yaml::as.yaml(rv$spec))
    add_log(paste("Updated dataset:", input$exp_ds_name))
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
