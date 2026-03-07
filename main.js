const fs = require("fs");

// ============================================================
// Function 1: getShiftDuration(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getShiftDuration(startTime, endTime) {
    // TODO: Implement this function
    // convert a 12-hour formatted time string into seconds since midnight
    function toSeconds(t) {
        // expected format: hh:mm:ss am/pm (space before am/pm)
        let parts = t.trim().split(" ");
        if (parts.length !== 2) return NaN;
        let [time, modifier] = parts;
        let [h, m, s] = time.split(":").map(Number);
        modifier = modifier.toLowerCase();
        if (modifier === "pm" && h !== 12) {
            h += 12;
        }
        if (modifier === "am" && h === 12) {
            h = 0;
        }
        return h * 3600 + m * 60 + s;
    }

    function formatDuration(sec) {
        if (isNaN(sec) || sec < 0) sec = 0;
        let h = Math.floor(sec / 3600);
        sec -= h * 3600;
        let m = Math.floor(sec / 60);
        let s = sec - m * 60;
        // pad minutes and seconds to two digits
        let mm = String(m).padStart(2, "0");
        let ss = String(s).padStart(2, "0");
        return `${h}:${mm}:${ss}`;
    }

    let startSec = toSeconds(startTime);
    let endSec = toSeconds(endTime);
    let diff = endSec - startSec;
    // if end is earlier, assume next day
    if (diff < 0) diff += 24 * 3600;
    return formatDuration(diff);
}

// ============================================================
// Function 2: getIdleTime(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getIdleTime(startTime, endTime) {
    // TODO: Implement this function
    // idle time rules:
    // - if shift duration is more than 14 hours, idle = shift - 14h
    // - otherwise idle is fixed 2 hours
    
    // reuse toSeconds and formatDuration from getShiftDuration
    function toSeconds(t) {
        let parts = t.trim().split(" ");
        if (parts.length !== 2) return NaN;
        let [time, modifier] = parts;
        let [h, m, s] = time.split(":").map(Number);
        modifier = modifier.toLowerCase();
        if (modifier === "pm" && h !== 12) {
            h += 12;
        }
        if (modifier === "am" && h === 12) {
            h = 0;
        }
        return h * 3600 + m * 60 + s;
    }

    function formatDuration(sec) {
        if (isNaN(sec) || sec < 0) sec = 0;
        let h = Math.floor(sec / 3600);
        sec -= h * 3600;
        let m = Math.floor(sec / 60);
        let s = sec - m * 60;
        let mm = String(m).padStart(2, "0");
        let ss = String(s).padStart(2, "0");
        return `${h}:${mm}:${ss}`;
    }

    let startSec = toSeconds(startTime);
    let endSec = toSeconds(endTime);
    let diff = endSec - startSec;
    if (diff < 0) diff += 24 * 3600;

    // apply idle rule
    const fourteen = 14 * 3600;
    let idleSec;
    if (diff > fourteen) {
        idleSec = diff - fourteen;
    } else {
        // minimum two hours break
        idleSec = 2 * 3600;
    }
    return formatDuration(idleSec);
}

// ============================================================
// Function 3: getActiveTime(shiftDuration, idleTime)
// shiftDuration: (typeof string) formatted as h:mm:ss
// idleTime: (typeof string) formatted as h:mm:ss
// Returns: string formatted as h:mm:ss
// ============================================================
function getActiveTime(shiftDuration, idleTime) {
    // TODO: Implement this function
    // both inputs are h:mm:ss (hours may be one or more digits)
    function parseHMS(str) {
        let parts = str.split(":");
        if (parts.length !== 3) return NaN;
        let [h, m, s] = parts.map(Number);
        return h * 3600 + m * 60 + s;
    }

    function formatDuration(sec) {
        if (isNaN(sec) || sec < 0) sec = 0;
        let h = Math.floor(sec / 3600);
        sec -= h * 3600;
        let m = Math.floor(sec / 60);
        let s = sec - m * 60;
        let mm = String(m).padStart(2, "0");
        let ss = String(s).padStart(2, "0");
        return `${h}:${mm}:${ss}`;
    }

    let shiftSec = parseHMS(shiftDuration);
    let idleSec = parseHMS(idleTime);
    let active = shiftSec - idleSec;
    if (active < 0) active = 0;
    return formatDuration(active);
}

// ============================================================
// Function 4: metQuota(date, activeTime)
// date: (typeof string) formatted as yyyy-mm-dd
// activeTime: (typeof string) formatted as h:mm:ss
// Returns: boolean
// ============================================================
function metQuota(date, activeTime) {
    // TODO: Implement this function
    // date: yyyy-mm-dd string
    // activeTime: h:mm:ss
    // quota: normal days 8h24m; Eid period Apr 10–30 2025 quota=6h
    function parseHMS(str) {
        let parts = str.split(":");
        if (parts.length !== 3) return NaN;
        let [h, m, s] = parts.map(Number);
        return h * 3600 + m * 60 + s;
    }

    // determine quota seconds
    let [year, mon, day] = date.split("-").map(Number);
    let quotaSec;
    if (year === 2025 && mon === 4 && day >= 10 && day <= 30) {
        quotaSec = 6 * 3600;
    } else {
        quotaSec = 8 * 3600 + 24 * 60;
    }
    let activeSec = parseHMS(activeTime);
    return activeSec >= quotaSec;
}

// ============================================================
// Function 5: addShiftRecord(textFile, shiftObj)
// textFile: (typeof string) path to shifts text file
// shiftObj: (typeof object) has driverID, driverName, date, startTime, endTime
// Returns: object with 10 properties or empty object {}
// ============================================================
function addShiftRecord(textFile, shiftObj) {
    // TODO: Implement this function
    // read existing data
    let data;
    try {
        data = fs.readFileSync(textFile, { encoding: 'utf8' });
    } catch (e) {
        // if file doesn't exist, start with header
        data = "DriverID,DriverName,Date,StartTime,EndTime,ShiftDuration,IdleTime,ActiveTime,MetQuota,HasBonus\n";
    }
    let lines = data.split("\n").filter(l => l.length > 0);
    // header assumed first line
    let header = lines[0];
    // check for duplicate (same driverID & date)
    let duplicate = lines.slice(1).some(line => {
        let parts = line.split(",");
        return parts[0] === shiftObj.driverID && parts[2] === shiftObj.date;
    });
    if (duplicate) {
        return {};
    }

    // compute fields
    let shiftDuration = getShiftDuration(shiftObj.startTime, shiftObj.endTime);
    let idleTime = getIdleTime(shiftObj.startTime, shiftObj.endTime);
    let activeTime = getActiveTime(shiftDuration, idleTime);
    let met = metQuota(shiftObj.date, activeTime);
    let hasBonus = false;

    let newRecord = [
        shiftObj.driverID,
        shiftObj.driverName,
        shiftObj.date,
        shiftObj.startTime,
        shiftObj.endTime,
        shiftDuration,
        idleTime,
        activeTime,
        met,
        hasBonus
    ].join(",");

    // append to file (ensure newline separation)
    let append = (lines.length > 0 ? "\n" : "") + newRecord;
    fs.appendFileSync(textFile, append, { encoding: 'utf8' });

    return {
        driverID: shiftObj.driverID,
        driverName: shiftObj.driverName,
        date: shiftObj.date,
        startTime: shiftObj.startTime,
        endTime: shiftObj.endTime,
        shiftDuration,
        idleTime,
        activeTime,
        metQuota: met,
        hasBonus
    };
}

// ============================================================
// Function 6: setBonus(textFile, driverID, date, newValue)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// date: (typeof string) formatted as yyyy-mm-dd
// newValue: (typeof boolean)
// Returns: nothing (void)
// ============================================================
function setBonus(textFile, driverID, date, newValue) {
    // TODO: Implement this function
    // read whole file, update the HasBonus column for matching driverID and date
    let data = fs.readFileSync(textFile, { encoding: 'utf8' });
    let lines = data.split("\n");
    if (lines.length === 0) return;
    // header remains unchanged
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === "") continue;
        let parts = lines[i].split(",");
        // driverID at index0, date at index2, HasBonus last index
        if (parts[0] === driverID && parts[2] === date) {
            // boolean to string
            parts[parts.length - 1] = newValue ? "true" : "false";
            lines[i] = parts.join(",");
            // assume only one record per driver per date
            break;
        }
    }
    fs.writeFileSync(textFile, lines.join("\n"), { encoding: 'utf8' });
}

// ============================================================
// Function 7: countBonusPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof string) formatted as mm or m
// Returns: number (-1 if driverID not found)
// ============================================================
function countBonusPerMonth(textFile, driverID, month) {
    // TODO: Implement this function
    let data;
    try {
        data = fs.readFileSync(textFile, { encoding: 'utf8' });
    } catch (e) {
        return -1;
    }
    let lines = data.split("\n").filter(l => l.trim().length > 0);
    let found = false;
    let count = 0;
    // normalize month to integer
    let mInt = parseInt(month, 10);
    for (let i = 1; i < lines.length; i++) {
        let parts = lines[i].split(",");
        if (parts[0] === driverID) {
            found = true;
            let dateParts = parts[2].split("-");
            let mon = parseInt(dateParts[1], 10);
            if (mon === mInt) {
                if (parts[parts.length - 1].toLowerCase() === "true") {
                    count++;
                }
            }
        }
    }
    return found ? count : -1;
}

// ============================================================
// Function 8: getTotalActiveHoursPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getTotalActiveHoursPerMonth(textFile, driverID, month) {
    // TODO: Implement this function
    let data;
    try {
        data = fs.readFileSync(textFile, { encoding: 'utf8' });
    } catch (e) {
        return "0:00:00";
    }
    let lines = data.split("\n").filter(l => l.trim().length > 0);
    let mInt = Number(month);
    function parseHMS(str) {
        let parts = str.split(":");
        if (parts.length !== 3) return 0;
        let [h, m, s] = parts.map(Number);
        return h * 3600 + m * 60 + s;
    }
    function format(sec) {
        if (isNaN(sec) || sec < 0) sec = 0;
        let h = Math.floor(sec / 3600);
        sec -= h * 3600;
        let m = Math.floor(sec / 60);
        let s = sec - m * 60;
        let mm = String(m).padStart(2, "0");
        let ss = String(s).padStart(2, "0");
        return `${h}:${mm}:${ss}`;
    }
    let total = 0;
    for (let i = 1; i < lines.length; i++) {
        let parts = lines[i].split(",");
        if (parts[0] === driverID) {
            let dateParts = parts[2].split("-");
            let mon = parseInt(dateParts[1], 10);
            if (mon === mInt) {
                total += parseHMS(parts[7]); // ActiveTime index
            }
        }
    }
    return format(total);
}

// ============================================================
// Function 9: getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month)
// textFile: (typeof string) path to shifts text file
// rateFile: (typeof string) path to driver rates text file
// bonusCount: (typeof number) total bonuses for given driver per month
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month) {
    // TODO: Implement this function
    // Calculate required hours based on actual shift dates quotas, minus bonus adjustments
    let data;
    try {
        data = fs.readFileSync(textFile, { encoding: 'utf8' });
    } catch (e) {
        return "0:00:00";
    }
    let lines = data.split("\n").filter(l => l.trim().length > 0);
    let mInt = Number(month);
    function isEidDate(dateStr) {
        // return true if within April 10-30 2025
        let [y, mon, d] = dateStr.split("-").map(Number);
        return y === 2025 && mon === 4 && d >= 10 && d <= 30;
    }
    // quota per non-eid shift = 8h24m
    const normalQuota = 8 * 3600 + 24 * 60;
    const eidQuota = 6 * 3600;
    // reduction per bonus = 2 hours
    const bonusReduction = 2 * 3600;

    let total = 0;
    for (let i = 1; i < lines.length; i++) {
        let parts = lines[i].split(",");
        if (parts[0] === driverID) {
            let date = parts[2];
            let mon = parseInt(date.split("-")[1], 10);
            if (mon === mInt) {
                total += isEidDate(date) ? eidQuota : normalQuota;
            }
        }
    }
    // subtract bonus reductions based on supplied bonusCount
    total -= bonusCount * bonusReduction;
    if (total < 0) total = 0;
    // format as hhh:mm:ss
    let h = Math.floor(total / 3600);
    let sec = total - h * 3600;
    let m = Math.floor(sec / 60);
    let s = sec - m * 60;
    let mm = String(m).padStart(2, "0");
    let ss = String(s).padStart(2, "0");
    return `${h}:${mm}:${ss}`;
}

// ============================================================
// Function 10: getNetPay(driverID, actualHours, requiredHours, rateFile)
// driverID: (typeof string)
// actualHours: (typeof string) formatted as hhh:mm:ss
// requiredHours: (typeof string) formatted as hhh:mm:ss
// rateFile: (typeof string) path to driver rates text file
// Returns: integer (net pay)
// ============================================================
function getNetPay(driverID, actualHours, requiredHours, rateFile) {
    // TODO: Implement this function
    // read rate file to get basePay and tier
    let data = fs.readFileSync(rateFile, { encoding: 'utf8' });
    let lines = data.split("\n").filter(l => l.trim().length > 0);
    let basePay = 0;
    let tier = null;
    for (let i = 0; i < lines.length; i++) {
        let parts = lines[i].split(",");
        if (parts[0] === driverID) {
            basePay = Number(parts[2]);
            tier = Number(parts[3]);
            break;
        }
    }
    if (basePay === 0 || tier === null) {
        return 0;
    }
    function parseHMS(str) {
        let [h, m, s] = str.split(":").map(Number);
        return h * 3600 + m * 60 + s;
    }
    let actualSec = parseHMS(actualHours);
    let requiredSec = parseHMS(requiredHours);
    let missing = requiredSec - actualSec;
    if (missing <= 0) {
        return basePay;
    }
    // convert to whole hours
    let missingHours = Math.floor(missing / 3600);
    // allowed based on tier
    let allowed;
    switch (tier) {
        case 1:
            allowed = 50;
            break;
        case 2:
            allowed = 20;
            break;
        case 3:
            allowed = 10;
            break;
        case 4:
            allowed = 3;
            break;
        default:
            allowed = 0;
    }
    if (missingHours <= allowed) {
        return basePay;
    }
    let over = missingHours - allowed;
    let deductionRate = Math.floor(basePay / 185);
    let deduction = over * deductionRate;
    let net = basePay - deduction;
    return net;
}

module.exports = {
    getShiftDuration,
    getIdleTime,
    getActiveTime,
    metQuota,
    addShiftRecord,
    setBonus,
    countBonusPerMonth,
    getTotalActiveHoursPerMonth,
    getRequiredHoursPerMonth,
    getNetPay
};
