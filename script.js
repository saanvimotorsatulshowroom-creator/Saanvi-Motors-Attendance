const SUPABASE_URL = "https://edcrxbzpubjmyeecrbfd.supabase.co";

const SUPABASE_KEY = "sb_publishable_Yn2d81cVel9qO_2y_p4kSg_DqxB1U1o";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const ADMIN_PASSWORD = "saanvi123";

let currentEmployee = null;


/* =========================
   DATE & TIME
========================= */

function todayKey() {
    const d = new Date();

    return d.getFullYear() + "-" +
        String(d.getMonth() + 1).padStart(2, "0") + "-" +
        String(d.getDate()).padStart(2, "0");
}

function currentTime() {
    return new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });
}

function updateDateTime() {

    const date = document.getElementById("date");
    const time = document.getElementById("time");

    if (date) {
        date.innerText = new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric"
        });
    }

    if (time) {
        time.innerText = new Date().toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        });
    }
}

setInterval(updateDateTime, 1000);
updateDateTime();


/* =========================
   TABS
========================= */

function showEmployee() {

    document.getElementById("employeePanel")
        .classList.remove("hidden");

    document.getElementById("adminPanel")
        .classList.add("hidden");
}

function showAdmin() {

    document.getElementById("employeePanel")
        .classList.add("hidden");

    document.getElementById("adminPanel")
        .classList.remove("hidden");
}


/* =========================
   EMPLOYEE LOGIN
========================= */

async function employeeLogin() {

    const code = document
        .getElementById("employeeCode")
        .value
        .trim()
        .toUpperCase();

    const pin = document
        .getElementById("employeePin")
        .value
        .trim();

    if (!code || !pin) {
        alert("Employee ID aur PIN dono enter karo.");
        return;
    }

    const { data, error } = await supabaseClient
        .from("employees")
        .select("*")
        .eq("employee_code", code)
        .limit(1);

    if (error) {

        console.error(error);

        alert("Database error: " + error.message);

        return;
    }

    if (!data || data.length === 0) {

        alert("Invalid Employee ID.");

        return;
    }

    const employee = data[0];

    if (String(employee.pin) !== String(pin)) {

        alert("Wrong PIN.");

        return;
    }

    currentEmployee = employee;

    document.getElementById("employeeLogin")
        .classList.add("hidden");

    document.getElementById("employeeArea")
        .classList.remove("hidden");

    document.getElementById("employeeName")
        .innerText = employee.employee_name;

    document.getElementById("employeeCodeDisplay")
        .innerText = "Employee ID: " + employee.employee_code;

    await showStatus();
}


/* =========================
   EMPLOYEE LOGOUT
========================= */

function employeeLogout() {

    currentEmployee = null;

    document.getElementById("employeeArea")
        .classList.add("hidden");

    document.getElementById("employeeLogin")
        .classList.remove("hidden");

    document.getElementById("employeeCode")
        .value = "";

    document.getElementById("employeePin")
        .value = "";

    document.getElementById("status")
        .innerText = "Aaj attendance mark nahi hui.";
}


/* =========================
   SHOW STATUS
========================= */

async function showStatus() {

    if (!currentEmployee) return;

    const status = document.getElementById("status");

    status.innerText = "Checking attendance...";

    const { data, error } = await supabaseClient
        .from("ATTENDANCE")
        .select("*")
        .eq("employee_name", currentEmployee.employee_name)
        .eq("attendance_date", todayKey())
        .order("id", { ascending: false })
        .limit(1);

    if (error) {

        console.error(error);

        status.innerText = "Attendance status load nahi hui.";

        return;
    }

    const record = data && data.length ? data[0] : null;

    if (!record) {

        status.innerText = "Aaj attendance mark nahi hui.";

        return;
    }

    if (record.in_time && record.out_time) {

        status.innerText =
            "IN: " + record.in_time +
            " | OUT: " + record.out_time;

    } else if (record.in_time) {

        status.innerText =
            "IN: " + record.in_time +
            " | OUT abhi nahi hua.";

    } else {

        status.innerText = "Aaj attendance mark nahi hui.";
    }
}


/* =========================
   MARK IN
========================= */

async function markIn() {

    if (!currentEmployee) {

        alert("Pehle Employee Login karo.");

        return;
    }

    if (!navigator.geolocation) {

        alert("Is phone/browser me Location available nahi hai.");

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


            const { data, error } =
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
                    { ascending: false }
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


            const existing =
                data && data.length
                    ? data[0]
                    : null;


            if (existing && existing.in_time) {

                alert(
                    "Aaj ka MARK IN already ho chuka hai."
                );

                return;
            }


            const { error: insertError } =
                await supabaseClient
                .from("ATTENDANCE")
                .insert({

                    employee_name:
                        currentEmployee.employee_name,

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
                        accuracy
                });


            if (insertError) {

                console.error(insertError);

                alert(
                    "Attendance save nahi hui: " +
                    insertError.message
                );

                return;
            }


            alert(
                "🟢 MARK IN successfully ho gaya."
            );

            await showStatus();
        },


        function(error) {

            console.error(error);

            if (error.code === 1) {

                alert(
                    "Location permission Allow karo."
                );

            } else if (error.code === 2) {

                alert(
                    "Phone ka GPS/Location ON karo."
                );

            } else if (error.code === 3) {

                alert(
                    "Location timeout. Dobara try karo."
                );

            } else {

                alert(
                    "Location error."
                );
            }
        },


        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }
    );
}


/* =========================
   MARK OUT
========================= */

async function markOut() {

    if (!currentEmployee) {

        alert("Pehle Employee Login karo.");

        return;
    }


    const { data, error } =
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
            { ascending: false }
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


    const record =
        data && data.length
            ? data[0]
            : null;


    if (!record || !record.in_time) {

        alert("Pehle MARK IN karo.");

        return;
    }


    if (record.out_time) {

        alert(
            "Aaj ka MARK OUT already ho chuka hai."
        );

        return;
    }


    const { error: updateError } =
        await supabaseClient
        .from("ATTENDANCE")
        .update({
            out_time: currentTime()
        })
        .eq("id", record.id);


    if (updateError) {

        console.error(updateError);

        alert(
            "MARK OUT save nahi hua: " +
            updateError.message
        );

        return;
    }


    alert(
        "🔴 MARK OUT successfully ho gaya."
    );

    await showStatus();
}


/* =========================
   ADMIN LOGIN
========================= */

async function loginAdmin() {

    const password =
        document.getElementById("adminPassword").value;


    if (password !== ADMIN_PASSWORD) {

        alert("Wrong Admin Password.");

        return;
    }


    document.getElementById("adminLoginArea")
        .classList.add("hidden");

    document.getElementById("adminArea")
        .classList.remove("hidden");


    await loadAdmin();
}


/* =========================
   ADMIN DATA
========================= */

async function loadAdmin() {

    const { data, error } =
        await supabaseClient
        .from("ATTENDANCE")
        .select("*")
        .eq(
            "attendance_date",
            todayKey()
        )
        .order(
            "id",
            { ascending: true }
        );


    if (error) {

        console.error(error);

        alert(
            "Admin data load nahi hui: " +
            error.message
        );

        return;
    }


    const table =
        document.getElementById(
            "attendanceTable"
        );

    table.innerHTML = "";


    const employeeList = [
        "Rohit Kumar",
        "Abhishek Raj",
        "Gudiya Kumari",
        "Farukh Alam",
        "Neyaj Alam",
        "Sipahi Kumar",
        "Chunnu Kumar"
         "abhinandan singh"
    ];


    let present = 0;


    employeeList.forEach(
        function(employeeName) {

            const records =
                data.filter(
                    function(item) {
                        return item.employee_name === employeeName;
                    }
                );


            const record =
                records.length
                    ? records[records.length - 1]
                    : null;


            if (record && record.in_time) {
                present++;
            }


            let locationHTML = "—";


            if (
                record &&
                record.latitude !== null &&
                record.longitude !== null
            ) {

                const mapURL =
                    "https://www.google.com/maps?q=" +
                    record.latitude +
                    "," +
                    record.longitude;


                locationHTML =
                    '<a href="' +
                    mapURL +
                    '" target="_blank" rel="noopener noreferrer">' +
                    "📍 View Location" +
                    "</a>";
            }


            const row =
                document.createElement("tr");


            row.innerHTML =
                "<td>" +
                employeeName +
                "</td>" +

                "<td>" +
                (record?.in_time || "—") +
                "</td>" +

                "<td>" +
                (record?.out_time || "—") +
                "</td>" +

                "<td>" +
                locationHTML +
                "</td>";


            table.appendChild(row);
        }
    );


    document.getElementById("summary")
        .innerText =
        "Present: " +
        present +
        " / " +
        employeeList.length;
}


/* =========================
   EXPORT CSV
========================= */

async function exportCSV() {

    const { data, error } =
        await supabaseClient
        .from("ATTENDANCE")
        .select("*")
        .eq(
            "attendance_date",
            todayKey()
        )
        .order(
            "id",
            { ascending: true }
        );


    if (error) {

        alert(
            "Export failed: " +
            error.message
        );

        return;
    }


    let csv =
        "Employee,Date,IN,OUT,Latitude,Longitude,Accuracy\n";


    data.forEach(
        function(record) {

            csv +=
                '"' + record.employee_name + '","' +
                record.attendance_date + '","' +
                (record.in_time || "") + '","' +
                (record.out_time || "") + '","' +
                (record.latitude || "") + '","' +
                (record.longitude || "") + '","' +
                (record.accuracy || "") + '"\n';
        }
    );


    const blob =
        new Blob(
            [csv],
            { type: "text/csv" }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        "Saanvi_Motors_Attendance_" +
        todayKey() +
        ".csv";


    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}
