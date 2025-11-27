# Generate LLM Prompt for ADaM Spec Creation

generate_llm_prompt <- function(sdtm_data, target_adams, complexity) {
  # 1. Summarize SDTM Data
  sdtm_summary <- ""
  if (!is.null(sdtm_data) && length(sdtm_data) > 0) {
    sdtm_summary <- "I have the following SDTM datasets available:\n\n"
    for (name in names(sdtm_data)) {
      df <- sdtm_data[[name]]
      cols <- paste(colnames(df), collapse = ", ")
      sdtm_summary <- paste0(sdtm_summary, "- **", name, "**: ", cols, "\n")
    }
  } else {
    sdtm_summary <- "No SDTM datasets are currently loaded.\n"
  }

  # 2. Define Complexity Instructions
  complexity_instr <- switch(complexity,
    "Low" = "Please create simple, direct mappings where possible. Avoid complex derivations. Use 1:1 mappings from SDTM variables.",
    "Medium" = "Include standard derivations (e.g., calculating study days, flagging baseline records). Handle common joins (e.g., ADSL to other domains).",
    "High" = "Include complex derivations such as windowing, criterion flagging (A/N/L), and detailed baseline logic. Handle multiple merge conditions and complex grouping.",
    "Include standard derivations."
  )

  # 3. Construct the Prompt
  prompt <- paste0(
    "I need you to create a YAML specification for CDISC ADaM datasets.\n\n",
    "**Target Datasets**: ", paste(target_adams, collapse = ", "), "\n\n",
    "**Context**:\n",
    sdtm_summary, "\n",
    "**Requirements**:\n",
    "- The output must be a valid YAML string matching the format used in the 'cdisc-shiny-app'.\n",
    "- Structure: datasets -> [name, type, columns -> [name, label, type, length, format, derivation -> [description, logic, sources]]].\n",
    "- **Complexity Level**: ", complexity, "\n",
    "- **Instructions**: ", complexity_instr, "\n\n",
    "**Output Format**:\n",
    "Please provide ONLY the YAML code block. Do not include conversational text."
  )

  return(prompt)
}
