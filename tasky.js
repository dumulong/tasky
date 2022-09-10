const unknownTask = "Unknown";
const taskPlus = "\u2795";

// Get some UI elements
const taskHeaderDiv = document.querySelector ("#task")
const logsDiv = document.querySelector (".logs");
const selectDateInput = document.querySelector("#selectDate");
const lsDataTextarea = document.querySelector("#lsData");


// Define the main variables
let data = []; // Main structure for the schedule
let tasks = []; // List of tasks

// The current task
const searchTask = (location.search ? decodeURI(location.search.substring(1)) : "");
let currentTask = (searchTask ? searchTask : unknownTask);
taskHeaderDiv.innerHTML = currentTask;
if (currentTask === unknownTask) {
    document.querySelector(".add-task-div").classList.remove("hidden");
    document.querySelector(".add-log-div").classList.add("hidden");
} else {
    document.querySelector(".add-task-div").classList.add("hidden");
    document.querySelector(".add-log-div").classList.remove("hidden");
}

// Set the default value for the input
selectDateInput.value = moment(new Date()).format("MM/DD/YYYY")

function loadPage () {
    readLocalStorage();
    setDefaultTask ();
    showLogs();
    addTasksClicks();
    addDeleteClick();
}

function readLocalStorage () {

    const LStorage = localStorage.getItem("Tasky");

    if (LStorage) {
        // Extract the data and the task list from the localStorage
        data = JSON.parse(LStorage)
        data.forEach(item => tasks.push(item.task));
    }

    // Add a task if we have one on the search query
    if (searchTask && !tasks.includes(searchTask)) {
        tasks.push(searchTask);
    }
    tasks.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    tasks.push(taskPlus);

    //Generate the links
    const links = tasks.map(x => `<div class="task-link">${x}</div>`);

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
            logDateLabel = moment(x).format("MM/DD/YYYY");
            return logTemplate.supplant({logDate: x, logDateLabel});
        })
        logsDiv.innerHTML = dateList.join("");
    }

}

function addLogDate () {

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
        if (links[i].innerHTML === taskPlus){
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
    lsDataTextarea.value = localStorage.getItem("Tasky");
}

function setLSData() {
    localStorage.getItem("Tasky", JSON.stringify(lsDataTextarea.value));
}

function closeLSData() {
    itemRedirect(currentTask);
}

function openLSData() {
    document.querySelector("#tasksList").classList.add("hidden");
    document.querySelector(".logs").classList.add("hidden");
    document.querySelector(".add-task-div").classList.add("hidden");
    document.querySelector(".add-log-div").classList.add("hidden");
    document.querySelector(".ls-data-open").classList.add("hidden");

    document.querySelector(".ls-data").classList.remove("hidden");
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