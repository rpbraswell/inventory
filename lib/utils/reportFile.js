
var path = require('path');

/*
 * Takes the identifier for a report and uses it to construct the full path to a file which can then be downloaded.
 * Report files are only used for exporting reports to downloadable CSV files.
 */
function reportFile(rptId) {
   let reportDir = process.env.REPORT_DIRECTORY;
   let date = new Date();
   let reportName = `${rptId}_${date.getFullYear()}_${date.getMonth()+1}_${date.getDate()}_${date.getHours()}_${date.getMinutes()}_${date.getSeconds()}.csv`;
   let reportPathName = path.join(reportDir, reportName);
   reportPathName = reportPathName.replace(/\\/g, '/');
   return reportPathName;
}

module.exports = reportFile;