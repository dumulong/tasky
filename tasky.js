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
    setTaskDescription();
    setUpPage();
    showLogs();
    addTasksClicks();
    addModalClick();

    // Set the default value for the input
    document.querySelector("#selectDate").value = dayjs().format("MM/DD/YYYY");

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

    // Add a link for a new task
    links.push(`<div class="task-link add-task-symbol" data-modal="modal-task">${addTaskSymbol}</div>`);

    //Add them to the list
    const separatorTemplate = '<span class="task-split">|</span>'
    const tasksListDiv = document.querySelector ("#tasksList")
    tasksListDiv.innerHTML = links.join(separatorTemplate);
}

function setDefaultTask () {
    // If we haven't selected a task yet, show me the first from the list
    if ((currentTask === unknownTask) && (tasks.length >= 1)) {
        if ((!tasks.includes(unknownTask)) && (tasks[0] !== currentTask)) {
            itemRedirect(tasks[0]);
        };
    }
}

function setTaskDescription() {
    const taskDesc = document.querySelector('.task-desc');
    const task = findCurrentTask();
    if (task) {
        taskDesc.innerHTML = task.description || "";
    }
}

function showLogs(){
    const task = findCurrentTask();
    if (task) {
        const logTemplate = document.querySelector ("#log-template").innerHTML;
        const dates = task.values.sort().reverse();
        const dateList = dates.map (x => {
            logDateLabel = dayjs(x).format("MM/DD/YYYY");
            comment = (task[x] && task[x].comment ? task[x].comment : "");
            return logTemplate.supplant({logDate: x, logDateLabel, comment});
        })
        document.querySelector (".logs").innerHTML = dateList.join("");

        if (dates.length > 0) {
            const lastDate = dayjs(dates[0]);
            const deltaLast = `Last completed: ${calcDeltaDate(lastDate)}`;
            document.querySelector (".delta-last").innerHTML = deltaLast;
        }

    } else {
        if (currentTask !== unknownTask) {
            const logs = document.querySelector (".logs");
            logs.innerHTML = `<div class="log log-empty">Entries not found, click "Add"</div>`;
        }
    }
}

function calcDeltaDate (dateStamp) {
    var today = dayjs();
    var completedDate = dayjs(dateStamp);

    var years = today.diff(completedDate, 'year');
    completedDate = completedDate.add(years, 'years');

    var months = today.diff(completedDate, 'months');
    completedDate = completedDate.add(months, 'months');

    var days = today.diff(completedDate, 'days');

    let diff = (years ? `${Math.abs(years)} year${years === 1 ? "" : "s"} ` : "");
    diff += (months ? `${Math.abs(months)} month${months === 1 ? "" : "s"} ` : "");
    diff += (days ? `${Math.abs(days)} day${days === 1 ? "" : "s"}` : "");

    const prefix = (today < completedDate ? "In " : "");
    const suffix = (today < completedDate ? "" : " ago");

    return (diff ? `${prefix}${diff}${suffix}` : "Today");
}

function addLogDate () {
    const selectDateInput = document.querySelector("#selectDate")
    const selectedDate = dayjs(selectDateInput.value, "MM/DD/YYYY").format("YYYYMMDD");

    let task = findCurrentTask();
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

function saveLog () {
    const task = findCurrentTask();
    const editLogDate = document.querySelector('#editLogDate');
    const logDate = editLogDate.innerHTML;

    const logEntry = dayjs(logDate).format("YYYYMMDD");
    const editLogComment = document.querySelector('[name="editLogComment"]');
    if (!task[logEntry]) {
        task[logEntry] = {};
    }
    task[logEntry].comment = editLogComment.value;
    localStorage.setItem("Tasky", JSON.stringify(data));
    itemRedirect(currentTask);
}

function deleteLog () {
    const taskNdx = data.findIndex (x => x.task === currentTask);
    const task = data[taskNdx];
    let redirectTo = currentTask;

    const editLogDate = document.querySelector('#editLogDate');
    const logDate = editLogDate.innerHTML;

    if (task.values.length === 1) {
        data.splice(taskNdx, 1);
        redirectTo = "";
    } else {
        const logEntry = dayjs(logDate).format("YYYYMMDD");
        task.values = task.values.filter(x => x !== logEntry);
        delete task[logEntry];
        redirectTo = currentTask;
    }
    localStorage.setItem("Tasky", JSON.stringify(data));
    itemRedirect(redirectTo);
}

function addNewTask () {
    const taskInput = document.querySelector("[name=newTaskName]");
    itemRedirect(taskInput.value);
}

function updateTask () {
    const taskInput = document.querySelector("[name=newTaskName]");
    const taskDescInput = document.querySelector("[name=taskDesc]");
    const task = findCurrentTask();

    if (task) {
        task.task = taskInput.value;
        task.description = taskDescInput.value;
        localStorage.setItem("Tasky", JSON.stringify(data));
    }
    itemRedirect(taskInput.value);
}

function addTasksClicks () {
    // Get all the links and add events to them
    const links = document.querySelectorAll(".task-link");
    for (var i = 0; i < links.length; i++) {
        if (links[i].innerHTML !== addTaskSymbol){
            links[i].addEventListener("click", event =>  {
                itemRedirect(event.target.innerHTML)
            });
        }
    }
}

// Modal

const modalFnc = {
    toggleTaskAddUpdate : (event) => {
        const trigger = event.target;
        const taskInput = document.querySelector("[name=newTaskName]");
        const title = document.querySelector("#modal-task .modal-subtitle");
        const descDiv = document.querySelector(".task-desc-input");
        const btnUpdate = document.querySelector("#btnUpdateTask");
        const btnAdd = document.querySelector("#btnAddTask");

        if (trigger.classList.contains("add-task-symbol")) {
            taskInput.value = "";
            title.innerHTML = "Add Task";
            descDiv.classList.add("hidden");
            btnUpdate.classList.add("hidden");
            btnAdd.classList.remove("hidden");
        } else { // Update task
            const task = findCurrentTask();
            if (task) {
                taskInput.value = task.task;
                const descInput = document.querySelector("[name=taskDesc]");
                descInput.value = task.description || "";
                descDiv.classList.remove("hidden");
            } else {
                taskInput.value = currentTask;
                descDiv.classList.add("hidden");
            }
            title.innerHTML = "Update Task";
            btnUpdate.classList.remove("hidden");
            btnAdd.classList.add("hidden");
        }
    },
    fillLogData : (event) => {
        const trigger = event.target;
        const logDate = trigger.dataset.value;
        const task = findCurrentTask();

        const editLogTask = document.querySelector('#editLogTask');
        editLogTask.innerHTML = task.task;

        const editLogDate = document.querySelector('#editLogDate');
        editLogDate.innerHTML = dayjs(logDate).format("MM/DD/YYYY");

        const logDelta = document.querySelector('.log-delta');
        const delta = dayjs(logDate);
        logDelta.innerHTML = `${calcDeltaDate(delta)}`;

        const editLogComment = document.querySelector('[name="editLogComment"]');
        const logDateData = task[logDate];
        if (logDateData && logDateData.comment) {
            editLogComment.value = logDateData.comment;
        } else {
            editLogComment.value = "";
        }
    },
    fillLSData : () => {
        const lsData = document.querySelector('[name="lsData"]');
        lsData.value = localStorage.getItem("Tasky");
    }
}

function addModalClick () {

    const modals = document.querySelectorAll('[data-modal]');

    modals.forEach(trigger => {
      trigger.addEventListener('click', event => {
        event.preventDefault();
        const modal = document.getElementById(trigger.dataset.modal);

        const preLoadFnc = modal.dataset.preLoadFnc;
        if (preLoadFnc && modalFnc[preLoadFnc]) {
            modalFnc[preLoadFnc](event);
        }

        modal.classList.add('open');
        const exits = modal.querySelectorAll('.modal-exit');
        exits.forEach(exit => {
          exit.addEventListener('click', event => {
            event.preventDefault();
            modal.classList.remove('open');
          });
        });
      });
    });
}

function closeAllModal () {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.remove('open');
    });
}

// Local storage

function setLSData() {
    const lsDataTextarea = document.querySelector("#lsData");
    localStorage.setItem("Tasky", lsDataTextarea.value);
    itemRedirect("");
}

// Helper function
function itemRedirect (searchQuery) {
    window.location.search = searchQuery
}

function findCurrentTask () {
    return data.find (x => x.task === currentTask);
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
