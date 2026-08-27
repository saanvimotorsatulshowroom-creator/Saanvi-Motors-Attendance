const SUPABASE_URL = "https://edcrxbzpubjmyeecrbfd.supabase.co";
const SUPABASE_KEY = "APNI_PUBLISHABLE_KEY_YAHAN_DALO";

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

async function markIn() {

    const employeeElement = document.getElementById("employee");

    if (!employeeElement) {
        alert("Employee selection nahi mil rahi.");
        return;
    }

    const employee = employeeElement.value;

    if (!employee) {
        alert("Pehle employee select karo.");
        return;
    }

    if (!navigator.geolocation) {
        alert("Is browser me location available nahi hai.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async function(position) {

            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            const accuracy = position.coords.accuracy;

            const { data: existing, error: checkError } =
                await supabaseClient
                .from("ATTENDANCE")
                .select("*")
                .eq("employee_name", employee)
                .eq("attendance_date", todayKey())
                .maybeSingle();

            if (checkError) {
                alert("Database check error: " + checkError.message);
                return;
            }

            if (existing && existing.in_time) {
                alert("Aaj ka IN already marked hai.");
                return;
            }

            const { error } =
                await supabaseClient
                .from("ATTENDANCE")
                .insert({
                    employee_name: employee,
                    attendance_date: todayKey(),
                    in_time: currentTime(),
                    latitude: latitude,
                    longitude: longitude,
                    accuracy: accuracy
                });

            if (error) {
                alert("Attendance save nahi hui: " + error.message);
                return;
            }

            alert("MARK IN successfully ho gaya.");
        },

        function(error) {

            if (error.code === 1) {
                alert("Location permission Allow karo.");
            } else if (error.code === 2) {
                alert("Location nahi mil rahi. GPS/Location ON karo.");
            } else {
                alert("Location error. Dobara try karo.");
            }
        },

        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }
    );
}

async function markOut() {

    const employeeElement = document.getElementById("employee");

    if (!employeeElement) {
        alert("Employee selection nahi mil rahi.");
        return;
    }

    const employee = employeeElement.value;

    if (!employee) {
        alert("Pehle employee select karo.");
        return;
    }

    const { data: existing, error: checkError } =
        await supabaseClient
        .from("ATTENDANCE")
        .select("*")
        .eq("employee_name", employee)
        .eq("attendance_date", todayKey())
        .maybeSingle();

    if (checkError) {
        alert("Database check error: " + checkError.message);
        return;
    }

    if (!existing || !existing.in_time) {
        alert("Pehle MARK IN karo.");
        return;
    }

    if (existing.out_time) {
        alert("Aaj ka OUT already marked hai.");
        return;
    }

    const { error } =
        await supabaseClient
        .from("ATTENDANCE")
        .update({
            out_time: currentTime()
        })
        .eq("id", existing.id);

    if (error) {
        alert("MARK OUT save nahi hua: " + error.message);
        return;
    }

    alert("MARK OUT successfully ho gaya.");
}

async function loginAdmin() {

    const passwordElement =
        document.getElementById("adminPassword");

    if (!passwordElement) {
        alert("Admin password box nahi mil raha.");
        return;
    }

    const password = passwordElement.value;

    if (password !== ADMIN_PASSWORD) {
        alert("Wrong password.");
        return;
    }

    const adminArea =
        document.getElementById("adminArea");

    if (adminArea) {
        adminArea.classList.remove("hidden");
    }

    await loadAdmin();
}

async function loadAdmin() {

    const { data, error } =
        await supabaseClient
        .from("ATTENDANCE")
        .select("*")
        .eq("attendance_date", todayKey())
        .order("id", { ascending: true });

    if (error) {
        alert("Admin data load nahi hui: " + error.message);
        return;
    }

    const table =
        document.getElementById("attendanceTable");

    if (!table) {
        alert("Admin attendance table nahi mili.");
        return;
    }

    table.innerHTML = "";

    let present = 0;

    employees.forEach(function(employee) {

        const record =
            data.find(function(item) {
                return item.employee_name === employee;
            });

        if (record && record.in_time) {
            present++;
        }

        const row =
            document.createElement("tr");

        let location = "—";

        if (
            record &&
            record.latitude !== null &&
            record.longitude !== null
        ) {
            location =
                '<a href="https://www.google.com/maps?q=' +
                record.latitude +
                "," +
                record.longitude +
                '" target="_blank">📍 View</a>';
        }

        row.innerHTML =
            "<td>" + employee + "</td>" +
            "<td>" + (record?.in_time || "—") + "</td>" +
            "<td>" + (record?.out_time || "—") + "</td>" +
            "<td>" + location + "</td>";

        table.appendChild(row);
    });

    const summary =
        document.getElementById("summary");

    if (summary) {
        summary.innerText =
            "Present: " +
            present +
            " / " +
            employees.length;
    }
}

function showEmployee() {

    const employeePanel =
        document.getElementById("employeePanel");

    const adminPanel =
        document.getElementById("adminPanel");

    if (employeePanel) {
        employeePanel.classList.remove("hidden");
    }

    if (adminPanel) {
        adminPanel.classList.add("hidden");
    }
}

function showAdmin() {

    const employeePanel =
        document.getElementById("employeePanel");

    const adminPanel =
        document.getElementById("adminPanel");

    if (employeePanel) {
        employeePanel.classList.add("hidden");
    }

    if (adminPanel) {
        adminPanel.classList.remove("hidden");
    }
}

function exportCSV() {
    alert("Export feature abhi add nahi kiya gaya.");
}
