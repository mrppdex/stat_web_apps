library(shiny)
library(yaml)
library(DiagrammeR)
library(DT)
library(shinythemes)
library(readr)
library(arrow)

source("generate_adam_shiny.R")

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
      h4("3. Configuration"),
      selectInput("output_format", "Output Format", choices = c("CSV", "Parquet", "RDS")),
      actionButton("generate_btn", "Generate ADaM Datasets", class = "btn-primary btn-block"),
      br(), br(),
      downloadButton("download_btn", "Download Results (Zip)", class = "btn-success btn-block")
    ),
    mainPanel(
      tabsetPanel(
        tabPanel(
          "Diagram",
          br(),
          grVizOutput("diagram", height = "600px")
        ),
        tabPanel(
          "Logs",
          br(),
          verbatimTextOutput("log_output")
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
}

shinyApp(ui = ui, server = server)
