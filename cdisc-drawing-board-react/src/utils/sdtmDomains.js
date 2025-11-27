export const sdtmDomains = {
  'AE': {
    desc: 'Adverse Events', columns: [
      { name: 'STUDYID', desc: 'Study Identifier', key: true, core: 'Required' }, { name: 'DOMAIN', desc: 'Domain Abbreviation', key: false, core: 'Required' },
      { name: 'USUBJID', desc: 'Unique Subject Identifier', key: true, core: 'Required' }, { name: 'AESEQ', desc: 'Sequence Number', key: false, core: 'Required' },
      { name: 'AETERM', desc: 'Reported Term for Adverse Event', key: false, core: 'Required' },
      { name: 'AELLT', desc: 'Lowest Level Term', key: false, core: 'Permissible' }, { name: 'AEBODSYS', desc: 'Body System or Organ Class', key: false, core: 'Permissible' },
      { name: 'AESER', desc: 'Serious Event', key: false, core: 'Permissible' }, { name: 'AESTDTC', desc: 'Start Date/Time of Adverse Event', key: false, core: 'Required' },
      { name: 'AEENDTC', desc: 'End Date/Time of Adverse Event', key: false, core: 'Permissible' }
    ]
  },
  'CM': {
    desc: 'Concomitant Medications', columns: [
      { name: 'STUDYID', key: true, desc: 'Study Identifier', core: 'Required' }, { name: 'DOMAIN', key: false, desc: 'Domain Abbreviation', core: 'Required' },
      { name: 'USUBJID', key: true, desc: 'Unique Subject Identifier', core: 'Required' }, { name: 'CMSEQ', key: false, desc: 'Sequence Number', core: 'Required' },
      { name: 'CMTRT', key: false, desc: 'Reported Name of Drug, Med, Therapy', core: 'Required' }, { name: 'CMINDC', key: false, desc: 'Indication', core: 'Permissible' },
      { name: 'CMDOSE', key: false, desc: 'Dose per Administration', core: 'Permissible' }, { name: 'CMDOSU', key: false, desc: 'Dose Units', core: 'Permissible' },
      { name: 'CMSTDTC', key: false, desc: 'Start Date/Time of Medication', core: 'Required' }, { name: 'CMENDTC', key: false, desc: 'End Date/Time of Medication', core: 'Permissible' }
    ]
  },
  'DM': {
    desc: 'Demographics', columns: [
      { name: 'STUDYID', key: true, desc: 'Study Identifier', core: 'Required' }, { name: 'DOMAIN', key: false, desc: 'Domain Abbreviation', core: 'Required' },
      { name: 'USUBJID', key: true, desc: 'Unique Subject Identifier', core: 'Required' }, { name: 'SUBJID', key: false, desc: 'Subject Identifier for the Study', core: 'Required' },
      { name: 'RFSTDTC', key: false, desc: 'Subject Reference Start Date/Time', core: 'Required' }, { name: 'RFENDTC', key: false, desc: 'Subject Reference End Date/Time', core: 'Required' },
      { name: 'SITEID', key: false, desc: 'Study Site Identifier', core: 'Required' }, { name: 'AGE', key: false, desc: 'Age', core: 'Permissible' },
      { name: 'SEX', key: false, desc: 'Sex', core: 'Permissible' }, { name: 'RACE', key: false, desc: 'Race', core: 'Permissible' },
      { name: 'ETHNIC', key: false, desc: 'Ethnicity', core: 'Permissible' }, { name: 'ARMCD', key: false, desc: 'Planned Arm Code', core: 'Required' },
      { name: 'ARM', key: false, desc: 'Description of Planned Arm', core: 'Required' }, { name: 'ACTARMCD', key: false, desc: 'Actual Arm Code', core: 'Permissible' },
      { name: 'ACTARM', key: false, desc: 'Description of Actual Arm', core: 'Permissible' }
    ]
  },
  'DS': {
    desc: 'Disposition', columns: [
      { name: 'STUDYID', key: true, desc: 'Study Identifier', core: 'Required' }, { name: 'DOMAIN', key: false, desc: 'Domain Abbreviation', core: 'Required' },
      { name: 'USUBJID', key: true, desc: 'Unique Subject Identifier', core: 'Required' }, { name: 'DSSEQ', key: false, desc: 'Sequence Number', core: 'Required' },
      { name: 'DSTERM', key: false, desc: 'Reported Term', core: 'Required' }, { name: 'DSDECOD', key: false, desc: 'Standardized Term', core: 'Required' },
      { name: 'DSCAT', key: false, desc: 'Category of Disposition Event', core: 'Permissible' }, { name: 'DSDTC', key: false, desc: 'Date/Time of Event', core: 'Required' }
    ]
  },
  'EX': {
    desc: 'Exposure', columns: [
      { name: 'STUDYID', key: true, desc: 'Study Identifier', core: 'Required' }, { name: 'DOMAIN', key: false, desc: 'Domain Abbreviation', core: 'Required' },
      { name: 'USUBJID', key: true, desc: 'Unique Subject Identifier', core: 'Required' }, { name: 'EXSEQ', key: false, desc: 'Sequence Number', core: 'Required' },
      { name: 'EXTRT', key: false, desc: 'Name of Treatment', core: 'Required' }, { name: 'EXDOSE', key: false, desc: 'Dose', core: 'Permissible' },
      { name: 'EXDOSU', key: false, desc: 'Dose Units', core: 'Permissible' }, { name: 'EXSTDTC', key: false, desc: 'Start Date/Time of Treatment', core: 'Required' },
      { name: 'EXENDTC', key: false, desc: 'End Date/Time of Treatment', core: 'Required' }
    ]
  },
  'LB': {
    desc: 'Laboratory Test Results', columns: [
      { name: 'STUDYID', key: true, desc: 'Study Identifier', core: 'Required' }, { name: 'DOMAIN', key: false, desc: 'Domain Abbreviation', core: 'Required' },
      { name: 'USUBJID', key: true, desc: 'Unique Subject Identifier', core: 'Required' }, { name: 'LBSEQ', key: false, desc: 'Sequence Number', core: 'Required' },
      { name: 'LBTESTCD', key: false, desc: 'Lab Test or Examination Short Name', core: 'Required' }, { name: 'LBTEST', key: false, desc: 'Lab Test or Examination Name', core: 'Required' },
      { name: 'LBCAT', key: false, desc: 'Category for Lab Test', core: 'Permissible' }, { name: 'LBORRES', key: false, desc: 'Result or Finding in Original Units', core: 'Required' },
      { name: 'LBSTRESN', key: false, desc: 'Numeric Result/Finding in Standard Units', core: 'Permissible' }, { name: 'LBNRIND', key: false, desc: 'Normal Range Indicator', core: 'Permissible' },
      { name: 'VISITNUM', key: false, desc: 'Visit Number', core: 'Permissible' }, { name: 'LBDTC', key: false, desc: 'Date/Time of Specimen Collection', core: 'Required' }
    ]
  },
  'PE': {
    desc: 'Physical Examination', columns: [
      { name: 'STUDYID', key: true, desc: 'Study Identifier', core: 'Required' }, { name: 'DOMAIN', key: false, desc: 'Domain Abbreviation', core: 'Required' },
      { name: 'USUBJID', key: true, desc: 'Unique Subject Identifier', core: 'Required' }, { name: 'PESEQ', key: false, desc: 'Sequence Number', core: 'Required' },
      { name: 'PETESTCD', key: false, desc: 'Physical Exam Test Short Name', core: 'Required' }, { name: 'PETEST', key: false, desc: 'Physical Exam Test Name', core: 'Required' },
      { name: 'PEORRES', key: false, desc: 'Result or Finding in Original Units', core: 'Required' }, { name: 'PESTAT', key: false, desc: 'Completion Status', core: 'Permissible' },
      { name: 'PEDTC', key: false, desc: 'Date/Time of Examination', core: 'Required' }
    ]
  },
  'SV': {
    desc: 'Subject Visits', columns: [
      { name: 'STUDYID', key: true, desc: 'Study Identifier', core: 'Required' }, { name: 'DOMAIN', key: false, desc: 'Domain Abbreviation', core: 'Required' },
      { name: 'USUBJID', key: true, desc: 'Unique Subject Identifier', core: 'Required' }, { name: 'VISITNUM', key: false, desc: 'Visit Number', core: 'Required' },
      { name: 'VISIT', key: false, desc: 'Visit Name', core: 'Required' }, { name: 'SVSTDTC', key: false, desc: 'Visit Start Date/Time', core: 'Required' }, { name: 'SVENDTC', key: false, desc: 'Visit End Date/Time', core: 'Required' }
    ]
  },
  'VS': {
    desc: 'Vital Signs', columns: [
      { name: 'STUDYID', key: true, desc: 'Study Identifier', core: 'Required' }, { name: 'DOMAIN', key: false, desc: 'Domain Abbreviation', core: 'Required' },
      { name: 'USUBJID', key: true, desc: 'Unique Subject Identifier', core: 'Required' }, { name: 'VSSEQ', key: false, desc: 'Sequence Number', core: 'Required' },
      { name: 'VSTESTCD', key: false, desc: 'Vital Signs Test Short Name', core: 'Required' }, { name: 'VSTEST', key: false, desc: 'Vital Signs Test Name', core: 'Required' },
      { name: 'VSPOS', key: false, desc: 'Vital Signs Position of Subject', core: 'Permissible' }, { name: 'VSORRES', key: false, desc: 'Result or Finding in Original Units', core: 'Required' },
      { name: 'VSSTRESN', key: false, desc: 'Numeric Result/Finding in Standard Units', core: 'Permissible' }, { name: 'VISITNUM', key: false, desc: 'Visit Number', core: 'Permissible' },
      { name: 'VISIT', key: false, desc: 'Visit Name', core: 'Permissible' }, { name: 'VSDTC', key: false, desc: 'Date/Time of Measurements', core: 'Required' }
    ]
  }
};
