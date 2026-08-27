const SUPABASE_URL = "https://edcrxbzpubjmyeecrbfd.supabase.co";
const SUPABASE_KEY = "sb_publishable_Yn2d81cVel9qO_2y_p4kSg_DqxB1U1o";const supabaseClient = window.supabase.createClient(
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

function showEmployee() {
    document.getElementById("employeePanel").classList.remove("hidden");
    document.getElementById("adminPanel").classList.add("hidden");
}

function showAdmin() {
    document.getElementById("employeePanel").classList.add("hidden");
    document.getElementById("adminPanel").classList.remove("hidden");
}

async function markIn() {

    const employee =
        document.getElementById("employee").value;

    if (!navigator.geolocation) {
        alert("Location support available nahi hai.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async function(position) {

            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            const accuracy = position.coords.accuracy;

            const { data: existing } =
                await supabaseClient
                .from("attendance")
                .select("*")
                .eq("employee_name", employee)
                .eq("attendance_date", todayKey())
                .maybeSingle();

            if (existing && existing.in_time) {
                alert("Aaj ka IN already marked hai.");
                return;
            }

            const { error } =
                await supabaseClient
                .from("attendance")
                .upsert({
                    employee_name: employee,
                    attendance_date: todayKey(),
                    in_time: currentTime(),
                    latitude: latitude,
                    longitude: longitude,
                    accuracy: accuracy
                }, {
                    onConflict: "employee_name,attendance_date"
                });

            if (error) {
                alert("Attendance save nahi hui: " + error.message);
                return;
            }

            alert("MARK IN successfully ho gaya.");
        },

        function() {
            alert(
                "Location permission Allow karo aur phone ki Location ON karo."
            );
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

async function markOut() {

    const employee =
        document.getElementById("employee").value;

    if (!navigator.geolocation) {
        alert("Location support available nahi hai.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async function(position) {

            const { data: existing } =
                await supabaseClient
                .from("attendance")
                .select("*")
                .eq("employee_name", employee)
                .eq("attendance_date", todayKey())
                .maybeSingle();

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
                .from("attendance")
                .update({
                    out_time: currentTime()
                })
                .eq("employee_name", employee)
                .eq("attendance_date", todayKey());

            if (error) {
                alert("OUT save nahi hua: " + error.message);
                return;
            }

            alert("MARK OUT successfully ho gaya.");
        },

        function() {
            alert(
                "Location permission Allow karo aur phone ki Location ON karo."
            );
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

async function loginAdmin() {

    const password =
        document.getElementById("adminPassword").value;

    if (password !== ADMIN_PASSWORD) {
        alert("Wrong password.");
        return;
    }

    document.getElementById("adminArea").classList.remove("hidden");

    await loadAdmin();
}

async function loadAdmin() {

    const { data, error } =
        await supabaseClient
        .from("attendance")
        .select("*")
        .eq("attendance_date", todayKey());

    if (error) {
        alert("Attendance load nahi hui: " + error.message);
        return;
    }

    const table =
        document.getElementById("attendanceTable");

    table.innerHTML = "";

    let present = 0;

    employees.forEach(function(employee) {

        const record =
            data.find(x => x.employee_name === employee);

        if (record && record.in_time) {
            present++;
        }

        const row =
            document.createElement("tr");

        const location =
            record
            ? `<a href="https://www.google.com/maps?q=${record.latitude},${record.longitude}" target="_blank">📍 View</a>`
            : "—";

        row.innerHTML =
            "<td>" + employee + "</td>" +
            "<td>" + (record?.in_time || "—") + "</td>" +
            "<td>" + (record?.out_time || "—") + "</td>" +
            "<td>" + location + "</td>";

        table.appendChild(row);
    });

    document.getElementById("summary").innerText =
        "Present: " + present + " / " + employees.length;
}

function exportCSV() {
    alert("Export feature baad me add karenge.");
}
