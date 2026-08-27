const SUPABASE_URL = "https://edcrxbzpubjmyeecrbfd.supabase.co";
const SUPABASE_KEY = sb_publishable_Yn2d81cVel9qO_2y_p4kSg_DqxB1U1o

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
const STORAGE_KEY = "saanvi_attendance";


function todayKey() {
    const d = new Date();

    return d.getFullYear() + "-" +
        String(d.getMonth() + 1).padStart(2, "0") + "-" +
        String(d.getDate()).padStart(2, "0");
}


function getData() {
    return JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "{}"
    );
}


function saveData(data) {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
    );
}


function currentTime() {
    return new Date().toLocaleTimeString(
        "en-IN",
        {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        }
    );
}


function markIn() {

    const employee =
        document.getElementById("employee").value;

    if (!navigator.geolocation) {
        alert("Is device me location support nahi hai.");
        return;
    }

    navigator.geolocation.getCurrentPosition(

        function(position) {

            const data = getData();
            const date = todayKey();

            if (!data[date]) {
                data[date] = {};
            }

            if (!data[date][employee]) {
                data[date][employee] = {};
            }

            if (data[date][employee].in) {
                alert("Aaj ka IN already marked hai.");
                return;
            }

            data[date][employee].in = currentTime();

            data[date][employee].latitude =
                position.coords.latitude;

            data[date][employee].longitude =
                position.coords.longitude;

            data[date][employee].accuracy =
                position.coords.accuracy;

            saveData(data);

            showStatus();

            alert("MARK IN successfully ho gaya.");
        },

        function() {

            alert(
                "Location nahi mil rahi hai.\n\n" +
                "Phone ki Location ON karo aur browser me Allow dabao."
            );

        },

        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}


function markOut() {

    const employee =
        document.getElementById("employee").value;

    if (!navigator.geolocation) {
        alert("Is device me location support nahi hai.");
        return;
    }

    navigator.geolocation.getCurrentPosition(

        function(position) {

            const data = getData();
            const date = todayKey();

            if (!data[date] ||
                !data[date][employee] ||
                !data[date][employee].in) {

                alert("Pehle MARK IN karo.");
                return;
            }

            if (data[date][employee].out) {
                alert("Aaj ka OUT already marked hai.");
                return;
            }

            data[date][employee].out = currentTime();

            data[date][employee].outLatitude =
                position.coords.latitude;

            data[date][employee].outLongitude =
                position.coords.longitude;

            data[date][employee].outAccuracy =
                position.coords.accuracy;

            saveData(data);

            showStatus();

            alert("MARK OUT successfully ho gaya.");
        },

        function() {

            alert(
                "Location nahi mil rahi hai.\n\n" +
                "Phone ki Location ON karo aur browser me Allow dabao."
            );

        },

        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}


function showStatus() {

    const employee =
        document.getElementById("employee").value;

    const data = getData();

    const date = todayKey();

    const record =
        data[date]?.[employee];

    if (!record) {

        document.getElementById("status").innerHTML =
            "Aaj attendance mark nahi hui.";

        return;
    }

    document.getElementById("status").innerHTML =

        "Employee: <b>" + employee + "</b><br>" +

        "IN: <b>" +
        (record.in || "—") +
        "</b><br>" +

        "OUT: <b>" +
        (record.out || "—") +
        "</b>";
}


function showEmployee() {

    document
        .getElementById("employeePanel")
        .classList.remove("hidden");

    document
        .getElementById("adminPanel")
        .classList.add("hidden");
}


function showAdmin() {

    document
        .getElementById("employeePanel")
        .classList.add("hidden");

    document
        .getElementById("adminPanel")
        .classList.remove("hidden");
}


function loginAdmin() {

    const password =
        document.getElementById("adminPassword").value;

    if (password !== ADMIN_PASSWORD) {

        alert("Wrong password.");

        return;
    }

    document
        .getElementById("adminArea")
        .classList.remove("hidden");

    loadAdmin();
}


function loadAdmin() {

    const data = getData();

    const date = todayKey();

    const today = data[date] || {};

    const table =
        document.getElementById("attendanceTable");

    table.innerHTML = "";

    let present = 0;

    employees.forEach(function(employee) {

        const record =
            today[employee] || {};

        if (record.in) {
            present++;
        }

        const row =
            document.createElement("tr");

        row.innerHTML =

            "<td>" +
            employee +
            "</td>" +

            "<td>" +
            (record.in || "—") +
            "</td>" +

            "<td>" +
            (record.out || "—") +
            "</td>";

        table.appendChild(row);
    });

    document.getElementById("summary").innerText =
        "Present: " +
        present +
        " / " +
        employees.length;
}


function exportCSV() {

    const data = getData();

    const date = todayKey();

    const today = data[date] || {};

    let csv =
        "Employee,IN,OUT,IN Latitude,IN Longitude\n";

    employees.forEach(function(employee) {

        const record =
            today[employee] || {};

        csv +=
            '"' + employee + '",' +
            '"' + (record.in || "") + '",' +
            '"' + (record.out || "") + '",' +
            '"' + (record.latitude || "") + '",' +
            '"' + (record.longitude || "") + '"\n';
    });

    const blob =
        new Blob(
            [csv],
            { type: "text/csv" }
        );

    const url =
        URL.createObjectURL(blob);

    const a =
        document.createElement("a");

    a.href = url;

    a.download =
        "Saanvi-Motors-Attendance-" +
        date +
        ".csv";

    a.click();

    URL.revokeObjectURL(url);
}
