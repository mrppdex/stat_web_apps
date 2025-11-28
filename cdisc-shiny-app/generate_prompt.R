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
    "- **IMPORTANT**: You MUST include the SDTM source datasets in the YAML under `datasets` with `type: SDTM`.\n",
    "- **IMPORTANT**: All columns MUST have a `type` defined (e.g., `text`, `integer`, `float`, `date`).\n",
    "- **Required YAML Structure Example**:\n",
    "datasets:\n",
    "  - name: DM\n",
    "    type: SDTM\n",
    "    position: {x: 50, y: 50}\n",
    "    columns:\n",
    "      - name: STUDYID\n",
    "        label: Study Identifier\n",
    "        type: text\n",
    "      - name: USUBJID\n",
    "        label: Unique Subject Identifier\n",
    "        type: text\n",
    "  - name: ADSL\n",
    "    type: ADaM\n",
    "    position: {x: 600, y: 50}\n",
    "    one_row_per_subject: true\n",
    "    join_keys: [STUDYID, USUBJID]\n",
    "    columns:\n",
    "      - name: STUDYID\n",
    "        label: Study Identifier\n",
    "        type: text\n",
    "        length: 20\n",
    "        derivation:\n",
    "          description: Copy from DM\n",
    "          logic: DM_STUDYID\n",
    "          sources: [DM.STUDYID]\n",
    "      - name: AVAL\n",
    "        label: Analysis Value\n",
    "        type: float\n",
    "        derivation:\n",
    "          description: Calculate mean of VSSTRESN grouped by USUBJID (overriding default grouping)\n",
    "          logic: mean(VS_VSSTRESN, na.rm = TRUE)\n",
    "          sources: [VS.VSSTRESN]\n",
    "          group_by: [USUBJID]\n",
    "- **Derivation Logic Rules**:\n",
    "  - The 'logic' field must be a valid R expression compatible with `dplyr::mutate()`.\n",
    "  - **IMPORTANT**: For date conversions from character (ISO 8601) format (e.g., '2023-01-15', '2023-01'), YOU MUST USE the helper function `impute_dtc()` instead of `as.Date()`.\n",
    "  - Example: `impute_dtc(DM_RFSTDTC)` instead of `as.Date(DM_RFSTDTC)`.\n",
    "  - **External Variables**: Refer to variables from OTHER datasets using `DOMAIN_VARIABLE` (e.g., `DM_USUBJID`).\n",
    "  - **Internal Variables**: Refer to variables created within the CURRENT dataset using the simple name (e.g., `TRTSDT`), NOT `DOMAIN_VARIABLE`.\n",
    "  - Do not use `$` syntax.\n",
    "- **Sources Field Rules**:\n",
    "  - List ALL datasets required for the derivation, including the current one if applicable.\n",
    "  - Format: `[DOMAIN.VARIABLE]` (e.g., `[DM.AGE]`, `[ADSL.TRTSDT]`).\n",
    "  - Do NOT include 'Unknown' in the sources list.\n",
    "  - **Dependency Check**: If you reference a column from another ADaM dataset (e.g., `ADSL.ACTARM`), you MUST ensure that column (`ACTARM`) is explicitly defined in the `columns` list of that dataset (`ADSL`).\n",
    "- **Complexity Level**: ", complexity, "\n",
    "- **Instructions**: ", complexity_instr, "\n\n",
    "**Output Format**:\n",
    "Please provide ONLY the YAML code block. Do not include conversational text."
  )

  return(prompt)
}
