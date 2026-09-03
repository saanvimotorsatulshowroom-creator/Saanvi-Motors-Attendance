/* =====================================================
   SUPABASE
===================================================== */

const SUPABASE_URL =
    "https://edcrxbzpubjmyeecrbfd.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_Yn2d81cVel9qO_2y_p4kSg_DqxB1U1o";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =====================================================
   ADMIN PASSWORD
===================================================== */

const ADMIN_PASSWORD = "sahithi123";


/* =====================================================
   GLOBALS
===================================================== */

let currentEmployee = null;
let cameraStream = null;
let capturedSelfieBlob = null;

let attendanceMode = null;

let currentAttendanceId = null;

let locationWatchId = null;
let trackingTimer = null;
let lastLocationUpload = 0;

let deferredInstallPrompt = null;


/* =====================================================
   PWA INSTALL
===================================================== */

window.addEventListener(
    "beforeinstallprompt",
    function(event) {

        event.preventDefault();

        deferredInstallPrompt = event;

        const installCard =
            document.getElementById("installCard");

        if (installCard) {
            installCard.classList.remove("hidden");
        }
    }
);


async function installApp() {

    if (!deferredInstallPrompt) {

        alert(
            "Browser menu se 'Install App' ya 'Add to Home Screen' select karo."
        );

        return;
    }

    deferredInstallPrompt.prompt();

    await deferredInstallPrompt.userChoice;

    deferredInstallPrompt = null;

    const installCard =
        document.getElementById("installCard");

    if (installCard) {
        installCard.classList.add("hidden");
    }
}


window.addEventListener(
    "appinstalled",
    function() {

        const installCard =
            document.getElementById("installCard");

        if (installCard) {
            installCard.classList.add("hidden");
        }
    }
);


/* =====================================================
   SERVICE WORKER
===================================================== */

if ("serviceWorker" in navigator) {

    window.addEventListener(
        "load",
        function() {

            navigator.serviceWorker
                .register("./sw.js")
                .catch(function(error) {

                    console.error(
                        "Service Worker Error:",
                        error
                    );
                });
        }
    );
}


/* =====================================================
   DATE
===================================================== */

function todayKey() {

    const d = new Date();

    return (
        d.getFullYear() +
        "-" +
        String(d.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(d.getDate()).padStart(2, "0")
    );
}


/* =====================================================
   CURRENT TIME
===================================================== */

function currentTime() {

    return new Date().toLocaleTimeString(
        "en-IN",
        {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        }
    );
}


/* =====================================================
   DATE / TIME DISPLAY
===================================================== */

function updateDateTime() {

    const date =
        document.getElementById("date");

    const time =
        document.getElementById("time");

    if (date) {

        date.innerText =
            new Date().toLocaleDateString(
                "en-IN",
                {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric"
                }
            );
    }

    if (time) {

        time.innerText =
            new Date().toLocaleTimeString(
                "en-IN",
                {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true
                }
            );
    }
}


setInterval(
    updateDateTime,
    1000
);

updateDateTime();


/* =====================================================
   TABS
===================================================== */

function showEmployee() {

    document
        .getElementById("employeePanel")
        .classList.remove("hidden");

    document
        .getElementById("adminPanel")
        .classList.add("hidden");

    document
        .getElementById("employeeTab")
        .classList.add("active");

    document
        .getElementById("adminTab")
        .classList.remove("active");
}


function showAdmin() {

    document
        .getElementById("employeePanel")
        .classList.add("hidden");

    document
        .getElementById("adminPanel")
        .classList.remove("hidden");

    document
        .getElementById("employeeTab")
        .classList.remove("active");

    document
        .getElementById("adminTab")
        .classList.add("active");
}


/* =====================================================
   BUTTON STATE
===================================================== */

function setButtons(
    markInEnabled,
    markOutEnabled
) {

    const markInButton =
        document.getElementById("markInButton");

    const markOutButton =
        document.getElementById("markOutButton");

    if (markInButton) {

        markInButton.disabled =
            !markInEnabled;
    }

    if (markOutButton) {

        markOutButton.disabled =
            !markOutEnabled;
    }
}


/* =====================================================
   INITIAL BUTTON STATE
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        /*
           Login se pehle dono attendance
           buttons disabled rahenge.
        */

        setButtons(false, false);
    }
);


/* =====================================================
   EMPLOYEE LOGIN
===================================================== */

async function employeeLogin() {

    const code =
        document
            .getElementById("employeeCode")
            .value
            .trim()
            .toUpperCase();

    const pin =
        document
            .getElementById("employeePin")
            .value
            .trim();

    if (!code || !pin) {

        alert(
            "Employee ID aur PIN dono enter karo."
        );

        return;
    }

    const {
        data,
        error
    } =
        await supabaseClient
            .from("employees")
            .select("*")
            .ilike(
                "employee_code",
                code
            )
            .limit(1);

    if (error) {

        console.error(error);

        alert(
            "Database error: " +
            error.message
        );

        return;
    }

    if (!data || !data.length) {

        alert(
            "Invalid Employee ID."
        );

        return;
    }

    const employee =
        data[0];

    if (
        String(employee.pin || "").trim() !==
        String(pin).trim()
    ) {

        alert(
            "Wrong PIN."
        );

        return;
    }

    currentEmployee =
        employee;

    document
        .getElementById("employeeLogin")
        .classList.add("hidden");

    document
        .getElementById("employeeArea")
        .classList.remove("hidden");

    document
        .getElementById("employeeName")
        .innerText =
        employee.employee_name;

    document
        .getElementById("employeeCodeDisplay")
        .innerText =
        "Employee ID: " +
        employee.employee_code;

    document
        .getElementById("locationStatus")
        .innerText =
        "📍 Location: Ready";

    /*
       Temporary state:
       MARK IN ON
       MARK OUT OFF

       showStatus() database se
       actual state check karega.
    */

    setButtons(true, false);

    await showStatus();
}


/* =====================================================
   LOGOUT
===================================================== */

function employeeLogout() {

    stopLocationTracking();

    closeCamera();

    currentEmployee = null;

    capturedSelfieBlob = null;

    currentAttendanceId = null;

    attendanceMode = null;

    document
        .getElementById("employeeArea")
        .classList.add("hidden");

    document
        .getElementById("employeeLogin")
        .classList.remove("hidden");

    document
        .getElementById("employeeCode")
        .value = "";

    document
        .getElementById("employeePin")
        .value = "";

    document
        .getElementById("status")
        .innerText =
        "Aaj attendance mark nahi hui.";

    document
        .getElementById("locationStatus")
        .innerText =
        "📍 Location: Ready";

    document
        .getElementById("liveTrackingBox")
        .classList.add("hidden");

    /*
       Login ke bahar dono disabled.
    */

    setButtons(false, false);
}


/* =====================================================
   GET TODAY RECORD
===================================================== */

async function getTodayRecord() {

    if (!currentEmployee) {

        return null;
    }

    const {
        data,
        error
    } =
        await supabaseClient
            .from("ATTENDANCE")
            .select("*")
            .eq(
                "employee_name",
                currentEmployee.employee_name
            )
            .eq(
                "attendance_date",
                todayKey()
            )
            .order(
                "id",
                {
                    ascending: false
                }
            )
            .limit(1);

    if (error) {

        console.error(
            "Get attendance error:",
            error
        );

        return null;
    }

    return data && data.length
        ? data[0]
        : null;
}


/* =====================================================
   SHOW STATUS
===================================================== */

async function showStatus() {

    if (!currentEmployee) {

        return;
    }

    const status =
        document.getElementById("status");

    status.innerText =
        "Checking attendance...";

    const record =
        await getTodayRecord();

    status.classList.remove(
        "status-duty",
        "status-complete"
    );


    /* =================================================
       NO ATTENDANCE
    ================================================= */

    if (!record) {

        status.innerText =
            "Aaj attendance mark nahi hui.";

        /*
           IMPORTANT FIX

           MARK IN = ENABLED
           MARK OUT = DISABLED
        */

        setButtons(true, false);

        stopLocationTracking();

        currentAttendanceId = null;

        return;
    }


    /* =================================================
       IN DONE - OUT PENDING
    ================================================= */

    if (
        record.in_time &&
        !record.out_time
    ) {

        status.classList.add(
            "status-duty"
        );

        status.innerText =
            "🟢 ON DUTY | IN: " +
            record.in_time +
            " | OUT abhi nahi hua.";

        currentAttendanceId =
            record.id;

        /*
           MARK IN = DISABLED
           MARK OUT = ENABLED
        */

        setButtons(false, true);

        startLocationTracking(
            record.id
        );

        return;
    }


    /* =================================================
       IN + OUT COMPLETE
    ================================================= */

    if (
        record.in_time &&
        record.out_time
    ) {

        status.classList.add(
            "status-complete"
        );

        status.innerText =
            "✅ DUTY COMPLETE | IN: " +
            record.in_time +
            " | OUT: " +
            record.out_time +
            " | Duration: " +
            formatDuration(
                getRecordDurationMinutes(
                    record
                )
            );

        /*
           BOTH DISABLED
        */

        setButtons(false, false);

        stopLocationTracking();

        currentAttendanceId =
            record.id;

        return;
    }


    /* =================================================
       UNKNOWN / INVALID STATE
    ================================================= */

    status.innerText =
        "Aaj attendance mark nahi hui.";

    setButtons(true, false);
}


/* =====================================================
   MARK IN START
===================================================== */

async function startAttendance() {

    if (!currentEmployee) {

        alert(
            "Pehle Employee Login karo."
        );

        return;
    }

    /*
       Extra safety check.
    */

    const existing =
        await getTodayRecord();

    if (
        existing &&
        existing.in_time
    ) {

        alert(
            "Aaj ka MARK IN already ho chuka hai."
        );

        await showStatus();

        return;
    }

    attendanceMode =
        "in";

    await openCamera();
}


/* =====================================================
   MARK OUT START
===================================================== */

async function startMarkOut() {

    if (!currentEmployee) {

        alert(
            "Pehle Employee Login karo."
        );

        return;
    }

    const record =
        await getTodayRecord();

    if (
        !record ||
        !record.in_time
    ) {

        alert(
            "Pehle MARK IN karo."
        );

        await showStatus();

        return;
    }

    if (record.out_time) {

        alert(
            "Aaj ka MARK OUT already ho chuka hai."
        );

        await showStatus();

        return;
    }

    currentAttendanceId =
        record.id;

    attendanceMode =
        "out";

    await openCamera();
}


/* =====================================================
   CAMERA
===================================================== */

async function openCamera() {

    try {

        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia
        ) {

            alert(
                "Camera is browser/device me available nahi hai."
            );

            return;
        }

        cameraStream =
            await navigator.mediaDevices.getUserMedia({

                video: {
                    facingMode: "user",
                    width: {
                        ideal: 1280
                    },
                    height: {
                        ideal: 720
                    }
                },

                audio: false
            });

        const video =
            document.getElementById(
                "cameraVideo"
            );

        video.srcObject =
            cameraStream;

        document
            .getElementById("cameraSection")
            .classList.remove("hidden");

        document
            .getElementById("locationStatus")
            .innerText =
            attendanceMode === "out"
                ? "📸 OUT selfie capture karo."
                : "📸 IN selfie capture karo.";

    }
    catch (error) {

        console.error(
            "Camera error:",
            error
        );

        alert(
            "Camera permission Allow karo."
        );
    }
}


/* =====================================================
   CAPTURE SELFIE
===================================================== */

function captureSelfie() {

    const video =
        document.getElementById(
            "cameraVideo"
        );

    const canvas =
        document.getElementById(
            "cameraCanvas"
        );

    const preview =
        document.getElementById(
            "selfiePreview"
        );

    if (
        !video.videoWidth ||
        !video.videoHeight
    ) {

        alert(
            "Camera ready hone ka wait karo."
        );

        return;
    }

    canvas.width =
        video.videoWidth;

    canvas.height =
        video.videoHeight;

    const ctx =
        canvas.getContext("2d");

    /*
       Mirror selfie
    */

    ctx.save();

    ctx.translate(
        canvas.width,
        0
    );

    ctx.scale(
        -1,
        1
    );

    ctx.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.restore();

    canvas.toBlob(

        function(blob) {

            if (!blob) {

                alert(
                    "Selfie capture nahi hui."
                );

                return;
            }

            capturedSelfieBlob =
                blob;

            preview.src =
                URL.createObjectURL(
                    blob
                );

            preview.classList.remove(
                "hidden"
            );

            closeCamera();

            document
                .getElementById(
                    "locationStatus"
                )
                .innerText =
                "📍 GPS location li ja rahi hai...";

            getGPSForAttendance();
        },

        "image/jpeg",

        0.85
    );
}


/* =====================================================
   CLOSE CAMERA
===================================================== */

function closeCamera() {

    if (cameraStream) {

        cameraStream
            .getTracks()
            .forEach(
                function(track) {
                    track.stop();
                }
            );

        cameraStream =
            null;
    }

    const video =
        document.getElementById(
            "cameraVideo"
        );

    if (video) {

        video.srcObject =
            null;
    }

    const cameraSection =
        document.getElementById(
            "cameraSection"
        );

    if (cameraSection) {

        cameraSection
            .classList
            .add("hidden");
    }
}


/* =====================================================
   GPS FOR ATTENDANCE
===================================================== */

function getGPSForAttendance() {

    if (!navigator.geolocation) {

        alert(
            "Is phone/browser me GPS available nahi hai."
        );

        capturedSelfieBlob =
            null;

        return;
    }

    navigator.geolocation.getCurrentPosition(

        async function(position) {

            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;

            const accuracy =
                position.coords.accuracy;

            document
                .getElementById(
                    "locationStatus"
                )
                .innerText =
                "📍 GPS captured. Saving...";

            if (
                attendanceMode ===
                "in"
            ) {

                await saveMarkIn(
                    latitude,
                    longitude,
                    accuracy
                );

            }
            else if (
                attendanceMode ===
                "out"
            ) {

                await saveMarkOut(
                    latitude,
                    longitude,
                    accuracy
                );
            }
        },

        function(error) {

            console.error(
                "GPS error:",
                error
            );

            capturedSelfieBlob =
                null;

            if (error.code === 1) {

                alert(
                    "Location permission Allow karo."
                );

            }
            else if (error.code === 2) {

                alert(
                    "Phone ka GPS/Location ON karo."
                );

            }
            else if (error.code === 3) {

                alert(
                    "Location timeout. Dobara try karo."
                );

            }
            else {

                alert(
                    "Location error."
                );
            }

            document
                .getElementById(
                    "locationStatus"
                )
                .innerText =
                "📍 Location not captured.";
        },

        {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 0
        }
    );
}


/* =====================================================
   UPLOAD SELFIE
===================================================== */

async function uploadSelfie(
    prefix
) {

    if (!capturedSelfieBlob) {

        throw new Error(
            "Selfie missing hai."
        );
    }

    const fileName =
        currentEmployee.employee_code +
        "_" +
        todayKey() +
        "_" +
        prefix +
        "_" +
        Date.now() +
        ".jpg";

    const filePath =
        "attendance/" +
        fileName;

    const {
        error
    } =
        await supabaseClient
            .storage
            .from("attendance-selfies")
            .upload(
                filePath,
                capturedSelfieBlob,
                {
                    contentType:
                        "image/jpeg",

                    upsert:
                        false
                }
            );

    if (error) {

        throw new Error(
            "Selfie upload nahi hui: " +
            error.message
        );
    }

    const {
        data
    } =
        supabaseClient
            .storage
            .from(
                "attendance-selfies"
            )
            .getPublicUrl(
                filePath
            );

    return data.publicUrl;
}


/* =====================================================
   SAVE MARK IN
===================================================== */

async function saveMarkIn(
    latitude,
    longitude,
    accuracy
) {

    try {

        const selfieURL =
            await uploadSelfie(
                "IN"
            );

        const now =
            new Date();

        const {
            data,
            error
        } =
            await supabaseClient
                .from("ATTENDANCE")
                .insert({

                    employee_name:
                        currentEmployee
                            .employee_name,

                    attendance_date:
                        todayKey(),

                    in_time:
                        currentTime(),

                    out_time:
                        null,

                    latitude:
                        latitude,

                    longitude:
                        longitude,

                    accuracy:
                        accuracy,

                    selfie_url:
                        selfieURL,

                    in_selfie_url:
                        selfieURL,

                    in_latitude:
                        latitude,

                    in_longitude:
                        longitude,

                    in_accuracy:
                        accuracy,

                    in_at:
                        now.toISOString(),

                    out_selfie_url:
                        null,

                    out_latitude:
                        null,

                    out_longitude:
                        null,

                    out_accuracy:
                        null,

                    out_at:
                        null
                })
                .select()
                .single();

        if (error) {

            console.error(
                "MARK IN error:",
                error
            );

            alert(
                "MARK IN save nahi hua: " +
                error.message
            );

            return;
        }

        currentAttendanceId =
            data.id;

        capturedSelfieBlob =
            null;

        document
            .getElementById(
                "locationStatus"
            )
            .innerText =
            "✅ IN Selfie + GPS saved";

        alert(
            "🟢 MARK IN successfully ho gaya.\n\n" +
            "📸 IN Selfie saved\n" +
            "📍 IN GPS saved\n" +
            "🟢 Live tracking started"
        );

        startLocationTracking(
            data.id
        );

        await showStatus();

    }
    catch (error) {

        console.error(
            "MARK IN exception:",
            error
        );

        alert(
            error.message
        );
    }
}


/* =====================================================
   SAVE MARK OUT
===================================================== */

async function saveMarkOut(
    latitude,
    longitude,
    accuracy
) {

    try {

        const record =
            await getTodayRecord();

        if (!record) {

            alert(
                "Attendance record nahi mila."
            );

            return;
        }

        if (
            !record.in_time ||
            record.out_time
        ) {

            await showStatus();

            return;
        }

        const selfieURL =
            await uploadSelfie(
                "OUT"
            );

        const now =
            new Date();

        const {
            error
        } =
            await supabaseClient
                .from("ATTENDANCE")
                .update({

                    out_time:
                        currentTime(),

                    out_selfie_url:
                        selfieURL,

                    out_latitude:
                        latitude,

                    out_longitude:
                        longitude,

                    out_accuracy:
                        accuracy,

                    out_at:
                        now.toISOString()
                })
                .eq(
                    "id",
                    record.id
                );

        if (error) {

            console.error(
                "MARK OUT error:",
                error
            );

            alert(
                "MARK OUT save nahi hua: " +
                error.message
            );

            return;
        }

        capturedSelfieBlob =
            null;

        stopLocationTracking();

        document
            .getElementById(
                "locationStatus"
            )
            .innerText =
            "✅ OUT Selfie + GPS saved";

        alert(
            "🔴 MARK OUT successfully ho gaya.\n\n" +
            "📸 OUT Selfie saved\n" +
            "📍 OUT GPS saved\n" +
            "📍 Location tracking stopped"
        );

        await showStatus();

    }
    catch (error) {

        console.error(
            "MARK OUT exception:",
            error
        );

        alert(
            error.message
        );
    }
}


/* =====================================================
   LIVE LOCATION TRACKING
===================================================== */

function startLocationTracking(
    attendanceId
) {

    if (!navigator.geolocation) {

        return;
    }

    currentAttendanceId =
        attendanceId;

    stopLocationTracking();

    document
        .getElementById(
            "liveTrackingBox"
        )
        .classList
        .remove("hidden");

    document
        .getElementById(
            "liveLocationText"
        )
        .innerText =
        "GPS tracking started...";

    locationWatchId =
        navigator.geolocation.watchPosition(

            function(position) {

                const now =
                    Date.now();

                const latitude =
                    position.coords.latitude;

                const longitude =
                    position.coords.longitude;

                const accuracy =
                    position.coords.accuracy;

                document
                    .getElementById(
                        "liveLocationText"
                    )
                    .innerText =
                    "Lat: " +
                    latitude.toFixed(6) +
                    " | Lng: " +
                    longitude.toFixed(6) +
                    " | Accuracy: " +
                    Math.round(
                        accuracy
                    ) +
                    "m";

                /*
                   20 second gap
                */

                if (
                    now -
                    lastLocationUpload >=
                    20000
                ) {

                    lastLocationUpload =
                        now;

                    saveLocationPoint(
                        attendanceId,
                        latitude,
                        longitude,
                        accuracy
                    );
                }
            },

            function(error) {

                console.error(
                    "Tracking error:",
                    error
                );

                document
                    .getElementById(
                        "liveLocationText"
                    )
                    .innerText =
                    "GPS signal waiting...";
            },

            {
                enableHighAccuracy:
                    true,

                maximumAge:
                    10000,

                timeout:
                    20000
            }
        );

    trackingTimer =
        setInterval(

            function() {

                navigator.geolocation
                    .getCurrentPosition(

                        function(position) {

                            const latitude =
                                position.coords.latitude;

                            const longitude =
                                position.coords.longitude;

                            const accuracy =
                                position.coords.accuracy;

                            saveLocationPoint(
                                attendanceId,
                                latitude,
                                longitude,
                                accuracy
                            );
                        },

                        function(error) {

                            console.log(
                                "Periodic GPS:",
                                error
                            );
                        },

                        {
                            enableHighAccuracy:
                                true,

                            maximumAge:
                                10000,

                            timeout:
                                20000
                        }
                    );

            },

            30000
        );
}


/* =====================================================
   SAVE GPS POINT
===================================================== */

async function saveLocationPoint(
    attendanceId,
    latitude,
    longitude,
    accuracy
) {

    if (
        !attendanceId ||
        !currentEmployee
    ) {

        return;
    }

    const {
        error
    } =
        await supabaseClient
            .from(
                "attendance_locations"
            )
            .insert({

                employee_id:
                    String(
                        currentEmployee
                            .employee_code
                    ),

                attendance_id:
                    attendanceId,

                latitude:
                    latitude,

                longitude:
                    longitude,

                accuracy:
                    accuracy,

                recorded_at:
                    new Date()
                        .toISOString()
            });

    if (error) {

        console.error(
            "Location save error:",
            error
        );
    }
}


/* =====================================================
   STOP TRACKING
===================================================== */

function stopLocationTracking() {

    if (
        locationWatchId !==
        null
    ) {

        navigator.geolocation
            .clearWatch(
                locationWatchId
            );

        locationWatchId =
            null;
    }

    if (trackingTimer) {

        clearInterval(
            trackingTimer
        );

        trackingTimer =
            null;
    }

    const box =
        document.getElementById(
            "liveTrackingBox"
        );

    if (box) {

        box.classList.add(
            "hidden"
        );
    }

    lastLocationUpload =
        0;
}


/* =====================================================
   DURATION
===================================================== */

function getRecordDurationMinutes(
    record
) {

    if (
        record.in_at &&
        record.out_at
    ) {

        const start =
            new Date(
                record.in_at
            );

        const end =
            new Date(
                record.out_at
            );

        return Math.max(
            0,
            Math.round(
                (end - start) /
                60000
            )
        );
    }

    if (
        record.in_time &&
        record.out_time
    ) {

        const start =
            parseTimeToday(
                record.in_time
            );

        const end =
            parseTimeToday(
                record.out_time
            );

        if (
            start &&
            end
        ) {

            return Math.max(
                0,
                Math.round(
                    (end - start) /
                    60000
                )
            );
        }
    }

    return null;
}


function parseTimeToday(
    timeString
) {

    if (!timeString) {

        return null;
    }

    const match =
        timeString.match(
            /^(\d{1,2}):(\d{2}):?(\d{0,2})\s*(AM|PM)$/i
        );

    if (!match) {

        return null;
    }

    let hour =
        parseInt(
            match[1],
            10
        );

    const minute =
        parseInt(
            match[2],
            10
        );

    const ampm =
        match[4].toUpperCase();

    if (
        ampm === "PM" &&
        hour !== 12
    ) {

        hour += 12;
    }

    if (
        ampm === "AM" &&
        hour === 12
    ) {

        hour = 0;
    }

    const d =
        new Date();

    d.setHours(
        hour,
        minute,
        0,
        0
    );

    return d;
}


function formatDuration(
    minutes
) {

    if (
        minutes === null ||
        minutes === undefined
    ) {

        return "—";
    }

    const h =
        Math.floor(
            minutes / 60
        );

    const m =
        minutes % 60;

    return (
        h +
        "h " +
        m +
        "m"
    );
}


/* =====================================================
   ADMIN LOGIN
===================================================== */

async function loginAdmin() {

    const password =
        document
            .getElementById(
                "adminPassword"
            )
            .value;

    if (
        password !==
        ADMIN_PASSWORD
    ) {

        alert(
            "Wrong Admin Password."
        );

        return;
    }

    document
        .getElementById(
            "adminLoginArea"
        )
        .classList
        .add("hidden");

    document
        .getElementById(
            "adminArea"
        )
        .classList
        .remove("hidden");

    const month =
        new Date();

    document
        .getElementById(
            "monthSelector"
        )
        .value =
        month.getFullYear() +
        "-" +
        String(
            month.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    await loadAdmin();
}


/* =====================================================
   ADMIN TODAY
===================================================== */

async function loadAdmin() {

    const date =
        todayKey();

    const {
        data: attendanceData,
        error: attendanceError
    } =
        await supabaseClient
            .from("ATTENDANCE")
            .select("*")
            .eq(
                "attendance_date",
                date
            )
            .order(
                "id",
                {
                    ascending:
                        true
                }
            );

    if (attendanceError) {

        alert(
            "Admin data load nahi hui: " +
            attendanceError.message
        );

        return;
    }

    const {
        data: employees,
        error: employeeError
    } =
        await supabaseClient
            .from("employees")
            .select("*")
            .order(
                "employee_name",
                {
                    ascending:
                        true
                }
            );

    if (employeeError) {

        alert(
            "Employee list load nahi hui: " +
            employeeError.message
        );

        return;
    }

    renderAttendanceTable(
        employees || [],
        attendanceData || []
    );

    updateSummary(
        employees || [],
        attendanceData || []
    );
}


/* =====================================================
   RENDER TODAY TABLE
===================================================== */

function renderAttendanceTable(
    employees,
    attendanceData
) {

    const table =
        document.getElementById(
            "attendanceTable"
        );

    table.innerHTML =
        "";

    employees.forEach(
        function(employee) {

            const records =
                attendanceData.filter(
                    function(item) {

                        return (
                            item.employee_name ===
                            employee.employee_name
                        );
                    }
                );

            const record =
                records.length
                    ? records[
                        records.length - 1
                    ]
                    : null;

            const row =
                document.createElement(
                    "tr"
                );

            let statusHTML =
                '<span class="badge badge-absent">ABSENT</span>';

            if (
                record &&
                record.in_time &&
                record.out_time
            ) {

                statusHTML =
                    '<span class="badge badge-present">PRESENT</span>';

            }
            else if (
                record &&
                record.in_time
            ) {

                statusHTML =
                    '<span class="badge badge-duty">ON DUTY</span>';
            }

            const duration =
                record
                    ? formatDuration(
                        getRecordDurationMinutes(
                            record
                        )
                    )
                    : "—";

            const inSelfie =
                record
                    ? selfieLink(
                        record.in_selfie_url ||
                        record.selfie_url,
                        "IN"
                    )
                    : "—";

            const outSelfie =
                record
                    ? selfieLink(
                        record.out_selfie_url,
                        "OUT"
                    )
                    : "—";

            const inLocation =
                record
                    ? locationLink(
                        record.in_latitude ??
                        record.latitude,
                        record.in_longitude ??
                        record.longitude,
                        "📍 IN Location"
                    )
                    : "—";

            const outLocation =
                record
                    ? locationLink(
                        record.out_latitude,
                        record.out_longitude,
                        "📍 OUT Location"
                    )
                    : "—";

            const historyButton =
                record
                    ? '<button class="secondary small-btn" onclick="showLocationHistory(' +
                      Number(record.id) +
                      ',\'' +
                      escapeJS(
                          employee.employee_name
                      ) +
                      '\')">🗺️ History</button>'
                    : "—";

            row.innerHTML =

                "<td>" +
                escapeHTML(
                    employee.employee_name
                ) +
                "</td>" +

                "<td>" +
                escapeHTML(
                    employee.employee_code ||
                    "—"
                ) +
                "</td>" +

                "<td>" +
                statusHTML +
                "</td>" +

                "<td>" +
                (
                    record?.in_time ||
                    "—"
                ) +
                "</td>" +

                "<td>" +
                (
                    record?.out_time ||
                    "—"
                ) +
                "</td>" +

                "<td>" +
                duration +
                "</td>" +

                "<td>" +
                inSelfie +
                "</td>" +

                "<td>" +
                outSelfie +
                "</td>" +

                "<td>" +
                inLocation +
                "</td>" +

                "<td>" +
                outLocation +
                "</td>" +

                "<td>" +
                historyButton +
                "</td>";

            table.appendChild(
                row
            );
        }
    );
}


/* =====================================================
   SUMMARY
===================================================== */

function updateSummary(
    employees,
    attendanceData
) {

    let present = 0;
    let absent = 0;
    let incomplete = 0;
    let duty = 0;

    employees.forEach(
        function(employee) {

            const record =
                attendanceData.find(
                    function(item) {

                        return (
                            item.employee_name ===
                            employee.employee_name
                        );
                    }
                );

            if (!record) {

                absent++;

            }
            else if (
                record.in_time &&
                record.out_time
            ) {

                present++;

            }
            else if (
                record.in_time
            ) {

                duty++;
                incomplete++;

            }
            else {

                absent++;
            }
        }
    );

    document
        .getElementById(
            "presentCount"
        )
        .innerText =
        present;

    document
        .getElementById(
            "absentCount"
        )
        .innerText =
        absent;

    document
        .getElementById(
            "incompleteCount"
        )
        .innerText =
        incomplete;

    document
        .getElementById(
            "dutyCount"
        )
        .innerText =
        duty;
}


/* =====================================================
   SELFIE LINK
===================================================== */

function selfieLink(
    url,
    label
) {

    if (!url) {

        return "—";
    }

    return (
        '<a href="' +
        escapeAttribute(url) +
        '" target="_blank" rel="noopener noreferrer">' +

        '<img src="' +
        escapeAttribute(url) +
        '" class="selfie-thumb" alt="' +
        escapeAttribute(label) +
        ' Selfie">' +

        "<br>" +
        label +
        " View</a>"
    );
}


/* =====================================================
   LOCATION LINK
===================================================== */

function locationLink(
    lat,
    lng,
    label
) {

    if (
        lat === null ||
        lat === undefined ||
        lng === null ||
        lng === undefined
    ) {

        return "—";
    }

    const mapURL =
        "https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent(
            lat +
            "," +
            lng
        );

    return (
        '<a href="' +
        escapeAttribute(mapURL) +
        '" target="_blank" rel="noopener noreferrer">' +
        label +
        "</a>"
    );
}


/* =====================================================
   LOCATION HISTORY
===================================================== */

async function showLocationHistory(
    attendanceId,
    employeeName
) {

    const section =
        document.getElementById(
            "historySection"
        );

    const title =
        document.getElementById(
            "historyTitle"
        );

    const content =
        document.getElementById(
            "historyContent"
        );

    section.classList.remove(
        "hidden"
    );

    title.innerText =
        "🗺️ Location History — " +
        employeeName;

    content.innerHTML =
        "Loading location history...";

    const {
        data,
        error
    } =
        await supabaseClient
            .from(
                "attendance_locations"
            )
            .select("*")
            .eq(
                "attendance_id",
                attendanceId
            )
            .order(
                "recorded_at",
                {
                    ascending:
                        true
                }
            );

    if (error) {

        content.innerHTML =
            "Location history load nahi hui: " +
            escapeHTML(
                error.message
            );

        return;
    }

    if (
        !data ||
        !data.length
    ) {

        content.innerHTML =
            "Abhi location history ka koi point nahi mila.";

        return;
    }

    content.innerHTML =
        "";

    data.forEach(
        function(point, index) {

            const mapURL =
                "https://www.google.com/maps/search/?api=1&query=" +
                encodeURIComponent(
                    point.latitude +
                    "," +
                    point.longitude
                );

            const time =
                new Date(
                    point.recorded_at
                ).toLocaleString(
                    "en-IN"
                );

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "history-item";

            item.innerHTML =

                "<b>Point " +
                (index + 1) +
                "</b><br>" +

                "🕐 " +
                escapeHTML(
                    time
                ) +
                "<br>" +

                "📍 " +
                Number(
                    point.latitude
                ).toFixed(6) +
                ", " +
                Number(
                    point.longitude
                ).toFixed(6) +
                "<br>" +

                "🎯 Accuracy: " +
                Math.round(
                    point.accuracy || 0
                ) +
                "m<br>" +

                '<a href="' +
                escapeAttribute(
                    mapURL
                ) +
                '" target="_blank" rel="noopener noreferrer">' +
                "Open in Google Maps" +
                "</a>";

            content.appendChild(
                item
            );
        }
    );

    section.scrollIntoView({
        behavior:
            "smooth",

        block:
            "start"
    });
}


/* =====================================================
   MONTHLY ATTENDANCE
===================================================== */

async function loadMonthlyAttendance() {

    const selected =
        document
            .getElementById(
                "monthSelector"
            )
            .value;

    if (!selected) {

        alert(
            "Month select karo."
        );

        return;
    }

    const [
        year,
        month
    ] =
        selected
            .split("-")
            .map(Number);

    const firstDay =
        year +
        "-" +
        String(month).padStart(
            2,
            "0"
        ) +
        "-01";

    const lastDate =
        new Date(
            year,
            month,
            0
        ).getDate();

    const lastDay =
        year +
        "-" +
        String(month).padStart(
            2,
            "0"
        ) +
        "-" +
        String(lastDate).padStart(
            2,
            "0"
        );

    const {
        data: attendanceData,
        error: attendanceError
    } =
        await supabaseClient
            .from("ATTENDANCE")
            .select("*")
            .gte(
                "attendance_date",
                firstDay
            )
            .lte(
                "attendance_date",
                lastDay
            )
            .order(
                "attendance_date",
                {
                    ascending:
                        true
                }
            );

    if (attendanceError) {

        alert(
            "Monthly attendance load nahi hui: " +
            attendanceError.message
        );

        return;
    }

    const {
        data: employees,
        error: employeeError
    } =
        await supabaseClient
            .from("employees")
            .select("*")
            .order(
                "employee_name",
                {
                    ascending:
                        true
                }
            );

    if (employeeError) {

        alert(
            "Employee list load nahi hui: " +
            employeeError.message
        );

        return;
    }

    let presentDays = 0;
    let absentDays = 0;
    let incompleteDays = 0;

    const daysInMonth =
        lastDate;

    (employees || []).forEach(
        function(employee) {

            for (
                let day = 1;
                day <= daysInMonth;
                day++
            ) {

                const date =
                    year +
                    "-" +
                    String(
                        month
                    ).padStart(
                        2,
                        "0"
                    ) +
                    "-" +
                    String(
                        day
                    ).padStart(
                        2,
                        "0"
                    );

                const record =
                    (
                        attendanceData ||
                        []
                    ).find(
                        function(item) {

                            return (
                                item.employee_name ===
                                employee.employee_name &&

                                item.attendance_date ===
                                date
                            );
                        }
                    );

                if (
                    record &&
                    record.in_time &&
                    record.out_time
                ) {

                    presentDays++;

                }
                else if (
                    record &&
                    record.in_time
                ) {

                    incompleteDays++;

                }
                else {

                    absentDays++;
                }
            }
        }
    );

    document
        .getElementById(
            "monthlySummary"
        )
        .innerText =
        "Month: " +
        selected +
        " | Present: " +
        presentDays +
        " | Absent: " +
        absentDays +
        " | Incomplete: " +
        incompleteDays;

    const table =
        document.getElementById(
            "attendanceTable"
        );

    table.innerHTML =
        "";

    (attendanceData || []).forEach(
        function(record) {

            const row =
                document.createElement(
                    "tr"
                );

            let status =
                "INCOMPLETE";

            if (
                record.in_time &&
                record.out_time
            ) {

                status =
                    "PRESENT";
            }

            const duration =
                formatDuration(
                    getRecordDurationMinutes(
                        record
                    )
                );

            row.innerHTML =

                "<td>" +
                escapeHTML(
                    record.employee_name ||
                    "—"
                ) +
                "</td>" +

                "<td>—</td>" +

                '<td><span class="badge ' +
                (
                    status === "PRESENT"
                        ? "badge-present"
                        : "badge-incomplete"
                ) +
                '">' +
                status +
                "</span></td>" +

                "<td>" +
                (
                    record.in_time ||
                    "—"
                ) +
                "</td>" +

                "<td>" +
                (
                    record.out_time ||
                    "—"
                ) +
                "</td>" +

                "<td>" +
                duration +
                "</td>" +

                "<td>" +
                selfieLink(
                    record.in_selfie_url ||
                    record.selfie_url,
                    "IN"
                ) +
                "</td>" +

                "<td>" +
                selfieLink(
                    record.out_selfie_url,
                    "OUT"
                ) +
                "</td>" +

                "<td>" +
                locationLink(
                    record.in_latitude ??
                    record.latitude,
                    record.in_longitude ??
                    record.longitude,
                    "📍 IN"
                ) +
                "</td>" +

                "<td>" +
                locationLink(
                    record.out_latitude,
                    record.out_longitude,
                    "📍 OUT"
                ) +
                "</td>" +

                "<td>" +
                '<button class="secondary small-btn" onclick="showLocationHistory(' +
                Number(record.id) +
                ',\'' +
                escapeJS(
                    record.employee_name ||
                    ""
                ) +
                '\')">🗺️ History</button>' +
                "</td>";

            table.appendChild(
                row
            );
        }
    );
}


/* =====================================================
   CSV EXPORT
===================================================== */

async function exportCSV() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("ATTENDANCE")
            .select("*")
            .eq(
                "attendance_date",
                todayKey()
            )
            .order(
                "id",
                {
                    ascending:
                        true
                }
            );

    if (error) {

        alert(
            "Export failed: " +
            error.message
        );

        return;
    }

    let csv =
        "Employee,Date,IN,OUT,Duration,IN Latitude,IN Longitude,OUT Latitude,OUT Longitude,IN Selfie,OUT Selfie\n";

    (data || []).forEach(
        function(record) {

            const duration =
                formatDuration(
                    getRecordDurationMinutes(
                        record
                    )
                );

            csv +=
                csvCell(
                    record.employee_name
                ) +
                "," +

                csvCell(
                    record.attendance_date
                ) +
                "," +

                csvCell(
                    record.in_time
                ) +
                "," +

                csvCell(
                    record.out_time
                ) +
                "," +

                csvCell(
                    duration
                ) +
                "," +

                csvCell(
                    record.in_latitude ??
                    record.latitude
                ) +
                "," +

                csvCell(
                    record.in_longitude ??
                    record.longitude
                ) +
                "," +

                csvCell(
                    record.out_latitude
                ) +
                "," +

                csvCell(
                    record.out_longitude
                ) +
                "," +

                csvCell(
                    record.in_selfie_url ||
                    record.selfie_url
                ) +
                "," +

                csvCell(
                    record.out_selfie_url
                ) +

                "\n";
        }
    );

    const blob =
        new Blob(
            [csv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );

    const url =
        URL.createObjectURL(
            blob
        );

    const link =
        document.createElement(
            "a"
        );

    link.href =
        url;

    link.download =
        "Saanvi_Motors_Attendance_" +
        todayKey() +
        ".csv";

    document.body.appendChild(
        link
    );

    link.click();

    document.body.removeChild(
        link
    );

    URL.revokeObjectURL(
        url
    );
}


/* =====================================================
   HELPERS
===================================================== */

function csvCell(value) {

    return (
        '"' +
        String(
            value ?? ""
        )
            .replace(
                /"/g,
                '""'
            ) +
        '"'
    );
}


function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


function escapeAttribute(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        );
}


function escapeJS(value) {

    return String(
        value ?? ""
    )
        .replace(
            /\\/g,
            "\\\\"
        )
        .replace(
            /'/g,
            "\\'"
        )
        .replace(
            /"/g,
            '\\"'
        )
        .replace(
            /\n/g,
            "\\n"
        )
        .replace(
            /\r/g,
            "\\r"
        );
}
