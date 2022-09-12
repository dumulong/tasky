const unknownTask = "Unknown";
const addTaskSymbol = "\u2795";

// Define the main variables
let data = []; // The local storage data
let tasks = []; // List of tasks
let currentTask;

function loadPage () {

    // Find the searched and the current task
    const searchQueryTask = (location.search ? decodeURI(location.search.substring(1)) : "");
    currentTask = (searchQueryTask ? searchQueryTask : unknownTask);

    readLocalStorage(searchQueryTask);
    setDefaultTask ();
    setUpPage();
    showLogs();
    addTasksClicks();
    addDeleteClick();

    // Set the default value for the input
    document.querySelector("#selectDate").value = (new luxon.DateTime.now().toFormat("MM/dd/yyyy"));

    // Show the current task
    document.querySelector ("#task").innerHTML = currentTask;
}

function setUpPage() {
    if (currentTask === unknownTask) {
        document.querySelector(".add-task-help").classList.remove("hidden");
        document.querySelector(".add-date-div").classList.add("hidden");
    } else {
        document.querySelector(".add-task-help").classList.add("hidden");
        document.querySelector(".add-date-div").classList.remove("hidden");
    }
}

function readLocalStorage (searchQueryTask) {

    const LStorage = localStorage.getItem("Tasky");

    if (LStorage) {
        // Extract the data and the task list from the localStorage
        data = JSON.parse(LStorage)
        data.forEach(item => tasks.push(item.task));
    }

    // Add a task if we have one on the search query
    if (searchQueryTask && !tasks.includes(searchQueryTask)) {
        tasks.push(searchQueryTask);
    }
    tasks.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

    //Generate the links
    const links = tasks.map(x => `<div class="task-link">${x}</div>`);
    links.push(`<div class="task-link add-task-symbol">${addTaskSymbol}</div>`);

    //Add them to the list
    const separatorTemplate = '<span class="task-split">|</span>'
    const tasksListDiv = document.querySelector ("#tasksList")
    tasksListDiv.innerHTML = links.join(separatorTemplate);
}

function setDefaultTask () {
    // If we haven't selected a task yet, show me the first from the list
    if ((currentTask === unknownTask) && (tasks.length > 1)) {
        if ((!tasks.includes(unknownTask)) && (tasks[0] !== currentTask)) {
            itemRedirect(tasks[0]);
        };
    }
}

function showLogs(){
    const task = data.find (x => x.task === currentTask);
    if (task) {
        const logTemplate = document.querySelector ("#log-template").innerHTML;
        const dates = task.values.sort().reverse();
        const dateList = dates.map (x => {
            logDateLabel = luxon.DateTime.fromISO(x).toFormat("MM/dd/yyyy");
            return logTemplate.supplant({logDate: x, logDateLabel});
        })
        document.querySelector (".logs").innerHTML = dateList.join("");

        if (dates.length > 0) {
            const lastDate = luxon.DateTime.fromISO(dates[0]);
            const deltaLast = `Last completed: ${calcDeltaDate(lastDate)}`;
            document.querySelector (".delta-last").innerHTML = deltaLast;
        }

    }
}

function calcDeltaDate (dateStamp) {
    var a = luxon.DateTime.now();
    var b = luxon.DateTime.fromISO(dateStamp);


    var dateDiff = a.diff(b, ['years','months','days']);
    const diffObj = {
        years : Math.floor(dateDiff.years),
        months : Math.floor(dateDiff.months),
        days : Math.floor(dateDiff.days)
    }

    let diff = (diffObj.years ? `${diffObj.years} year${diffObj.years === 1 ? "" : "s"} ` : "");
    diff += (diffObj.months ? `${diffObj.months} month${diffObj.months === 1 ? "" : "s"} ` : "");
    diff += (diffObj.days ? `${diffObj.days} day${diffObj.days === 1 ? "" : "s"}` : "");

    return (diff ? `${diff} ${(a < b ? "ago" : "")}` : "Today");
}

function addLogDate () {
    const selectDateInput = document.querySelector("#selectDate")
    const selectedDate = moment(selectDateInput.value).format("YYYYMMDD");

    let task = data.find (x => x.task === currentTask);
    if (!task) {
        task = { task : currentTask, values : [ selectedDate ] };
        data.push (task);
    } else {
        if (!task.values.includes(selectedDate)){
            task.values.push(selectedDate);
        }
    }
    localStorage.setItem("Tasky", JSON.stringify(data));
    itemRedirect(currentTask);
}

function addDeleteClick () {

    const trashes = document.querySelectorAll(".delete-icon");

    for (var i = 0; i < trashes.length; i++) {

        trashes[i].addEventListener("click", function (e) {

            let redirectTo = currentTask;

            const taskNdx = data.findIndex (x => x.task === currentTask);

            const dateValueNdx = data[taskNdx].values.findIndex(x => x === e.target.dataset.value);
            data[taskNdx].values.splice(dateValueNdx, 1);

            // Remove the task is there are no date left
            if (data[taskNdx].values.length === 0) {
                data.splice(taskNdx, 1);
                redirectTo = "";
            }
            localStorage.setItem("Tasky", JSON.stringify(data));
            itemRedirect(redirectTo);
        });

    }

}

function addTasksClicks () {
    // Get all the links and add events to them
    const links = document.querySelectorAll(".task-link");
    for (var i = 0; i < links.length; i++) {
        if (links[i].innerHTML === addTaskSymbol){
            links[i].addEventListener("click", function (e) {
                var ans = prompt("Please enter a name for the new task:");
                if (ans !== null) {
                    itemRedirect(ans);
                }
            });

        } else {
            links[i].addEventListener("click", function (e) {
                itemRedirect(e.target.innerHTML)
            });
        }
    }
}

function getLSData() {
    const lsDataTextarea = document.querySelector("#lsData");
    lsDataTextarea.value = localStorage.getItem("Tasky");
}

function setLSData() {
    const lsDataTextarea = document.querySelector("#lsData");
    localStorage.setItem("Tasky", lsDataTextarea.value);
}

function closeLSData() {
    itemRedirect("");
}

function openLSData() {
    document.querySelector(".main").classList.add("hidden");
    document.querySelector(".admin").classList.remove("hidden");
    getLSData();
}

// Helper function
function itemRedirect (searchQuery) {
    window.location.search = searchQuery
}

// Helper function: given an object o, replace {var} with value of property o.var for any string
String.prototype.supplant = function (o) {
    return this.replace(
        /{([^{}]*)}/g,
        function (a, b) {
            var r = o[b];
            return typeof r === 'string' || typeof r === 'number' ? r : a;
        }
    );
};