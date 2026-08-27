const SUPABASE_URL = "https://edcrxbzpubjmyeecrbfd.supabase.co";
const SUPABASE_KEY = "sb_publishable_Yn2d81cVel9qO_2y_p4kSg_DqxB1U1o";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const employees = [
    "Rohit Kumar",
    "Abhishek Raj",
    "Gudiya Kumari",
    "Farukh Alam",
    "Neyaj Alam",
    "Sipahi Kumar",
    "Chunnu Kumar"
];

const ADMIN_PASSWORD = "saanvi123";


/* =========================
   DATE & TIME
========================= */

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

function currentTime() {
    return new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });
}


/* =========================
   EMPLOYEE / ADMIN
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
   STATUS
========================= */

async function showStatus() {

    const employee =
        document.getElementById("employee").value;

    const status =
        document.getElementById("status");

    status.innerText = "Checking attendance...";

    const { data, error } =
        await supabaseClient
        .from("ATTENDANCE")
        .select("*")
        .eq("employee_name", employee)
        .eq("attendance_date", todayKey())
        .order("id", { ascending: false })
        .limit(1);

    if (error) {
        console.error(error);

        status.innerText =
            "Attendance status load nahi hui.";

        return;
    }

    const existing =
        data && data.length > 0
            ? data[0]
            : null;

    if (!existing) {
        status.innerText =
            "Aaj attendance mark nahi hui.";

        return;
    }

    if (existing.in_time && existing.out_time) {

        status.innerText =
            "IN: " +
            existing.in_time +
            " | OUT: " +
            existing.out_time;

    } else if (existing.in_time) {

        status.innerText =
            "IN: " +
            existing.in_time +
            " | OUT abhi nahi hua.";

    } else {

        status.innerText =
            "Aaj attendance mark nahi hui.";
    }
}


/* =========================
   MARK IN
========================= */

async function markIn() {

    const employee =
        document.getElementById("employee").value;

    if (!employee) {
        alert("Employee select karo.");
        return;
    }

    if (!navigator.geolocation) {
        alert("Is browser me GPS/location available nahi hai.");
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


            /* CHECK TODAY'S RECORD */

            const { data, error: checkError } =
                await supabaseClient
                .from("ATTENDANCE")
                .select("*")
                .eq("employee_name", employee)
                .eq("attendance_date", todayKey())
                .order("id", { ascending: false })
                .limit(1);


            if (checkError) {

                console.error(checkError);

                alert(
                    "Database error: " +
                    checkError.message
                );

                return;
            }


            const existing =
                data && data.length > 0
                    ? data[0]
                    : null;


            if (existing && existing.in_time) {

                alert(
                    "Aaj ka MARK IN already ho chuka hai."
                );

                return;
            }


            /* INSERT ATTENDANCE */

            const { error } =
                await supabaseClient
                .from("ATTENDANCE")
                .insert({

                    employee_name: employee,

                    attendance_date: todayKey(),

                    in_time: currentTime(),

                    out_time: null,

                    latitude: latitude,

                    longitude: longitude,

                    accuracy: accuracy

                });


            if (error) {

                console.error(error);

                alert(
                    "Attendance save nahi hui: " +
                    error.message
                );

                return;
            }


            alert(
                "🟢 MARK IN successfully ho gaya."
            );

            showStatus();
        },


        function(error) {

            console.error(error);

            if (error.code === 1) {

                alert(
                    "Location permission Allow karo."
                );

            } else if (error.code === 2) {

                alert(
                    "Location nahi mil rahi. Phone ka GPS/Location ON karo."
                );

            } else {

                alert(
                    "Location error. Dobara try karo."
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

    const employee =
        document.getElementById("employee").value;

    if (!employee) {
        alert("Employee select karo.");
        return;
    }


    /* FIND TODAY'S LATEST RECORD */

    const { data, error: checkError } =
        await supabaseClient
        .from("ATTENDANCE")
        .select("*")
        .eq("employee_name", employee)
        .eq("attendance_date", todayKey())
        .order("id", { ascending: false })
        .limit(1);


    if (checkError) {

        console.error(checkError);

        alert(
            "Database error: " +
            checkError.message
        );

        return;
    }


    const existing =
        data && data.length > 0
            ? data[0]
            : null;


    if (!existing || !existing.in_time) {

        alert(
            "Pehle MARK IN karo."
        );

        return;
    }


    if (existing.out_time) {

        alert(
            "Aaj ka MARK OUT already ho chuka hai."
        );

        return;
    }


    /* UPDATE OUT TIME */

    const { error } =
        await supabaseClient
        .from("ATTENDANCE")
        .update({

            out_time: currentTime()

        })
        .eq("id", existing.id);


    if (error) {

        console.error(error);

        alert(
            "MARK OUT save nahi hua: " +
            error.message
        );

        return;
    }


    alert(
        "🔴 MARK OUT successfully ho gaya."
    );

    showStatus();
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
        .eq("attendance_date", todayKey())
        .order("id", { ascending: true });


    if (error) {

        console.error(error);

        alert(
            "Admin data load nahi hui: " +
            error.message
        );

        return;
    }


    const table =
        document.getElementById("attendanceTable");

    table.innerHTML = "";


    let present = 0;


    employees.forEach(function(employee) {

        const records =
            data.filter(function(item) {

                return item.employee_name === employee;

            });


        /* LATEST RECORD */

        const record =
            records.length > 0
                ? records[records.length - 1]
                : null;


        if (record && record.in_time) {
            present++;
        }


        const row =
            document.createElement("tr");


        row.innerHTML =

            "<td>" +
            employee +
            "</td>" +

            "<td>" +
            (record?.in_time || "—") +
            "</td>" +

            "<td>" +
            (record?.out_time || "—") +
            "</td>";


        table.appendChild(row);

    });


    document.getElementById("summary").innerText =

        "Present: " +
        present +
        " / " +
        employees.length;
}


/* =========================
   EXPORT
========================= */

function exportCSV() {

    alert(
        "Export feature abhi add nahi kiya gaya."
    );
}


/* =========================
   DATE & CLOCK
========================= */

function updateDateTime() {

    const now = new Date();


    const dateElement =
        document.getElementById("date");

    const timeElement =
        document.getElementById("time");


    if (dateElement) {

        dateElement.innerText =
            now.toLocaleDateString("en-IN", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric"
            });
    }


    if (timeElement) {

        timeElement.innerText =
            now.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true
            });
    }
}


setInterval(updateDateTime, 1000);

updateDateTime();
