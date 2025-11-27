export const testSpec = {
  datasets: [
    // SDTM Domains
    {
      name: "DM",
      type: "SDTM",
      position: { x: 50, y: 50 },
      columns: [
        { name: "STUDYID", desc: "Study Identifier", key: true },
        { name: "USUBJID", desc: "Unique Subject Identifier", key: true },
        { name: "SUBJID", desc: "Subject Identifier for the Study", key: false },
        { name: "RFSTDTC", desc: "Subject Reference Start Date/Time", key: false },
        { name: "RFENDTC", desc: "Subject Reference End Date/Time", key: false },
        { name: "SITEID", desc: "Study Site Identifier", key: false },
        { name: "AGE", desc: "Age", key: false },
        { name: "SEX", desc: "Sex", key: false },
        { name: "RACE", desc: "Race", key: false },
        { name: "ARM", desc: "Description of Planned Arm", key: false },
        { name: "ACTARM", desc: "Description of Actual Arm", key: false },
        { name: "DMDTC", desc: "Date/Time of Collection", key: false }
      ]
    },
    {
      name: "AE",
      type: "SDTM",
      position: { x: 50, y: 350 },
      columns: [
        { name: "STUDYID", desc: "Study Identifier", key: true },
        { name: "USUBJID", desc: "Unique Subject Identifier", key: true },
        { name: "AESEQ", desc: "Sequence Number", key: true },
        { name: "AETERM", desc: "Reported Term for the Adverse Event", key: false },
        { name: "AEDECOD", desc: "Dictionary-Derived Term", key: false },
        { name: "AEBODSYS", desc: "Body System or Organ Class", key: false },
        { name: "AESTDTC", desc: "Start Date/Time of Adverse Event", key: false },
        { name: "AEENDTC", desc: "End Date/Time of Adverse Event", key: false },
        { name: "AESER", desc: "Serious Event", key: false }
      ]
    },
    {
      name: "DS",
      type: "SDTM",
      position: { x: 50, y: 650 },
      columns: [
        { name: "STUDYID", desc: "Study Identifier", key: true },
        { name: "USUBJID", desc: "Unique Subject Identifier", key: true },
        { name: "DSSEQ", desc: "Sequence Number", key: true },
        { name: "DSTERM", desc: "Reported Term for the Event", key: false },
        { name: "DSDECOD", desc: "Standardized Disposition Term", key: false },
        { name: "DSCAT", desc: "Category for Disposition Event", key: false },
        { name: "DSSTDTC", desc: "Start Date/Time of Event", key: false }
      ]
    },
    {
      name: "LB",
      type: "SDTM",
      position: { x: 300, y: 50 },
      columns: [
        { name: "STUDYID", desc: "Study Identifier", key: true },
        { name: "USUBJID", desc: "Unique Subject Identifier", key: true },
        { name: "LBSEQ", desc: "Sequence Number", key: true },
        { name: "LBTESTCD", desc: "Lab Test or Examination Short Name", key: false },
        { name: "LBTEST", desc: "Lab Test or Examination Name", key: false },
        { name: "LBORRES", desc: "Result or Finding in Original Units", key: false },
        { name: "LBORRESU", desc: "Original Units", key: false },
        { name: "LBSTRESC", desc: "Character Result/Finding in Std Format", key: false },
        { name: "LBSTRESN", desc: "Numeric Result/Finding in Standard Units", key: false },
        { name: "LBSTRESU", desc: "Standard Units", key: false },
        { name: "LBDTC", desc: "Date/Time of Specimen Collection", key: false }
      ]
    },
    {
      name: "EX",
      type: "SDTM",
      position: { x: 300, y: 350 },
      columns: [
        { name: "STUDYID", desc: "Study Identifier", key: true },
        { name: "USUBJID", desc: "Unique Subject Identifier", key: true },
        { name: "EXSEQ", desc: "Sequence Number", key: true },
        { name: "EXTRT", desc: "Name of Treatment", key: false },
        { name: "EXDOSE", desc: "Dose", key: false },
        { name: "EXDOSU", desc: "Dose Units", key: false },
        { name: "EXSTDTC", desc: "Start Date/Time of Treatment", key: false },
        { name: "EXENDTC", desc: "End Date/Time of Treatment", key: false }
      ]
    },

    // ADaM Datasets
    {
      name: "ADSL",
      type: "ADaM",
      position: { x: 600, y: 200 },
      one_row_per_subject: true,
      join_keys: ["STUDYID", "USUBJID"],
      columns: [
        {
          name: "STUDYID",
          desc: "Study Identifier",
          key: true,
          derivation: {
            description: "Copy from DM",
            logic: "DM_STUDYID",
            sources: ["DM.STUDYID"]
          }
        },
        {
          name: "USUBJID",
          desc: "Unique Subject Identifier",
          key: true,
          derivation: {
            description: "Copy from DM",
            logic: "DM_USUBJID",
            sources: ["DM.USUBJID"]
          }
        },
        {
          name: "SUBJID",
          desc: "Subject Identifier for the Study",
          key: false,
          derivation: {
            description: "Copy from DM",
            logic: "DM_SUBJID",
            sources: ["DM.SUBJID"]
          }
        },
        {
          name: "SITEID",
          desc: "Study Site Identifier",
          key: false,
          derivation: {
            description: "Copy from DM",
            logic: "DM_SITEID",
            sources: ["DM.SITEID"]
          }
        },
        {
          name: "AGE",
          desc: "Age",
          key: false,
          derivation: {
            description: "Copy from DM",
            logic: "DM_AGE",
            sources: ["DM.AGE"]
          }
        },
        {
          name: "SEX",
          desc: "Sex",
          key: false,
          derivation: {
            description: "Copy from DM",
            logic: "DM_SEX",
            sources: ["DM.SEX"]
          }
        },
        {
          name: "RACE",
          desc: "Race",
          key: false,
          derivation: {
            description: "Copy from DM",
            logic: "DM_RACE",
            sources: ["DM.RACE"]
          }
        },
        {
          name: "TRTSDT",
          desc: "Date of First Exposure to Treatment",
          key: false,
          derivation: {
            description: "Derived from EXSTDTC",
            logic: "min(as.Date(EX_EXSTDTC), na.rm = TRUE)",
            sources: ["EX.EXSTDTC"]
          }
        },
        {
          name: "TRTEDT",
          desc: "Date of Last Exposure to Treatment",
          key: false,
          derivation: {
            description: "Derived from EXENDTC",
            logic: "max(as.Date(EX_EXENDTC), na.rm = TRUE)",
            sources: ["EX.EXENDTC"]
          }
        }
      ]
    },
    {
      name: "ADAE",
      type: "ADaM",
      position: { x: 900, y: 50 },
      one_row_per_subject: false,
      join_keys: ["STUDYID", "USUBJID", "AESEQ"],
      columns: [
        {
          name: "STUDYID",
          desc: "Study Identifier",
          key: true,
          derivation: {
            description: "Copy from ADSL",
            logic: "ADSL_STUDYID",
            sources: ["ADSL.STUDYID"]
          }
        },
        {
          name: "USUBJID",
          desc: "Unique Subject Identifier",
          key: true,
          derivation: {
            description: "Copy from ADSL",
            logic: "ADSL_USUBJID",
            sources: ["ADSL.USUBJID"]
          }
        },
        {
          name: "AESEQ",
          desc: "Sequence Number",
          key: true,
          derivation: {
            description: "Copy from AE",
            logic: "AE_AESEQ",
            sources: ["AE.AESEQ"]
          }
        },
        {
          name: "AETERM",
          desc: "Reported Term for the Adverse Event",
          key: false,
          derivation: {
            description: "Copy from AE",
            logic: "AE_AETERM",
            sources: ["AE.AETERM"]
          }
        },
        {
          name: "AEDECOD",
          desc: "Dictionary-Derived Term",
          key: false,
          derivation: {
            description: "Copy from AE",
            logic: "AE_AEDECOD",
            sources: ["AE.AEDECOD"]
          }
        },
        {
          name: "TRTSDT",
          desc: "Date of First Exposure to Treatment",
          key: false,
          derivation: {
            description: "Copy from ADSL",
            logic: "ADSL_TRTSDT",
            sources: ["ADSL.TRTSDT"]
          }
        },
        {
          name: "ASTDT",
          desc: "Analysis Start Date",
          key: false,
          derivation: {
            description: "Derived from AESTDTC",
            logic: "as.Date(AE_AESTDTC)",
            sources: ["AE.AESTDTC"]
          }
        }
      ]
    },
    {
      name: "ADLB",
      type: "ADaM",
      position: { x: 900, y: 350 },
      one_row_per_subject: false,
      join_keys: ["STUDYID", "USUBJID", "LBSEQ"],
      group_keys: ["STUDYID", "USUBJID", "PARAMCD"],
      columns: [
        {
          name: "STUDYID",
          desc: "Study Identifier",
          key: true,
          derivation: {
            description: "Copy from ADSL",
            logic: "ADSL_STUDYID",
            sources: ["ADSL.STUDYID"]
          }
        },
        {
          name: "USUBJID",
          desc: "Unique Subject Identifier",
          key: true,
          derivation: {
            description: "Copy from ADSL",
            logic: "ADSL_USUBJID",
            sources: ["ADSL.USUBJID"]
          }
        },
        {
          name: "LBSEQ",
          desc: "Sequence Number",
          key: true,
          derivation: {
            description: "Copy from LB",
            logic: "LB_LBSEQ",
            sources: ["LB.LBSEQ"]
          }
        },
        {
          name: "PARAMCD",
          desc: "Parameter Code",
          key: false,
          derivation: {
            description: "Derived from LBTESTCD",
            logic: "LB_LBTESTCD",
            sources: ["LB.LBTESTCD"]
          }
        },
        {
          name: "PARAM",
          desc: "Parameter",
          key: false,
          derivation: {
            description: "Derived from LBTEST",
            logic: "LB_LBTEST",
            sources: ["LB.LBTEST"]
          }
        },
        {
          name: "AVAL",
          desc: "Analysis Value",
          key: false,
          derivation: {
            description: "Derived from LBSTRESN",
            logic: "LB_LBSTRESN",
            sources: ["LB.LBSTRESN"]
          }
        },
        {
          name: "ADT",
          desc: "Analysis Date",
          key: false,
          derivation: {
            description: "Derived from LBDTC",
            logic: "as.Date(LB_LBDTC)",
            sources: ["LB.LBDTC"]
          }
        }
      ]
    },
    {
      name: "ADDS",
      type: "ADaM",
      position: { x: 900, y: 650 },
      one_row_per_subject: false,
      join_keys: ["STUDYID", "USUBJID", "DSSEQ"],
      group_keys: ["STUDYID", "USUBJID", "PARAMCD"],
      columns: [
        {
          name: "STUDYID",
          desc: "Study Identifier",
          key: true,
          derivation: {
            description: "Copy from ADSL",
            logic: "ADSL_STUDYID",
            sources: ["ADSL.STUDYID"]
          }
        },
        {
          name: "USUBJID",
          desc: "Unique Subject Identifier",
          key: true,
          derivation: {
            description: "Copy from ADSL",
            logic: "ADSL_USUBJID",
            sources: ["ADSL.USUBJID"]
          }
        },
        {
          name: "DSSEQ",
          desc: "Sequence Number",
          key: true,
          derivation: {
            description: "Copy from DS",
            logic: "DS_DSSEQ",
            sources: ["DS.DSSEQ"]
          }
        },
        {
          name: "PARAMCD",
          desc: "Parameter Code",
          key: false,
          derivation: {
            description: "Derived from DSTERM",
            logic: "DS_DSTERM",
            sources: ["DS.DSTERM"]
          }
        },
        {
          name: "ADT",
          desc: "Analysis Date",
          key: false,
          derivation: {
            description: "Derived from DSSTDTC",
            logic: "as.Date(DS_DSSTDTC)",
            sources: ["DS.DSSTDTC"]
          }
        }
      ]
    },
    {
      name: "ADEX",
      type: "ADaM",
      position: { x: 1200, y: 200 },
      one_row_per_subject: false,
      join_keys: ["STUDYID", "USUBJID", "EXSEQ"],
      group_keys: ["STUDYID", "USUBJID", "PARAMCD"],
      columns: [
        {
          name: "STUDYID",
          desc: "Study Identifier",
          key: true,
          derivation: {
            description: "Copy from ADSL",
            logic: "ADSL_STUDYID",
            sources: ["ADSL.STUDYID"]
          }
        },
        {
          name: "USUBJID",
          desc: "Unique Subject Identifier",
          key: true,
          derivation: {
            description: "Copy from ADSL",
            logic: "ADSL_USUBJID",
            sources: ["ADSL.USUBJID"]
          }
        },
        {
          name: "EXSEQ",
          desc: "Sequence Number",
          key: true,
          derivation: {
            description: "Copy from EX",
            logic: "EX_EXSEQ",
            sources: ["EX.EXSEQ"]
          }
        },
        {
          name: "PARAMCD",
          desc: "Parameter Code",
          key: false,
          derivation: {
            description: "Derived from EXTRT",
            logic: "EX_EXTRT",
            sources: ["EX.EXTRT"]
          }
        },
        {
          name: "AVAL",
          desc: "Analysis Value",
          key: false,
          derivation: {
            description: "Derived from EXDOSE",
            logic: "EX_EXDOSE",
            sources: ["EX.EXDOSE"]
          }
        },
        {
          name: "ASTDT",
          desc: "Analysis Start Date",
          key: false,
          derivation: {
            description: "Derived from EXSTDTC",
            logic: "as.Date(EX_EXSTDTC)",
            sources: ["EX.EXSTDTC"]
          }
        },
        {
          name: "AENDT",
          desc: "Analysis End Date",
          key: false,
          derivation: {
            description: "Derived from EXENDTC",
            logic: "as.Date(EX_EXENDTC)",
            sources: ["EX.EXENDTC"]
          }
        }
      ]
    }
  ]
};
