const unknownTask = "Unknown Task";
const addTaskSymbol = "\u2795";

const LocalStorageKey = Object.freeze({
    "data" : "Tasky",
    "prefs" : "Tasky_preferences"
})

// Define the main variables
let prefs = {
    currentTask : unknownTask,
    currentPage : 1,
    pageSize : 10,
    pageWindow : 5
};
let data = []; // The local storage data
let tasks = []; // List of tasks
let pagination;

function loadPage () {
    readLocalStorage();
    extractTaskList();
    redirectToDefaultTask ();
    showCurrentTask();
    showTaskList();
    toggleTaskData();
    if (prefs.currentTask !== unknownTask) {
        initPagination();
        showLogs();
        showPagination();
    }
    addModalClick();
}

function readLocalStorage () {

    const TaskyPrefLS = localStorage.getItem(LocalStorageKey.prefs);
    const taskyLS = localStorage.getItem(LocalStorageKey.data);

    if (TaskyPrefLS) {
        try {
            prefs = { ...prefs, ...JSON.parse(TaskyPrefLS) };
        } catch (error) {
            console.log(`%cERROR: %cInvalid preferences for localStorage '${LocalStorageKey.prefs}'.`, "color:red;font-weight:800", "");
        }
    }

    if (taskyLS) {
        try {
            data = JSON.parse(taskyLS);
        } catch (error) {
            console.log(`%cERROR: %cInvalid data for localStorage '${LocalStorageKey.data}'.`, "color:red;font-weight:800", "");
        }
    }

}

function redirectToDefaultTask () {
    // If we haven't selected a task yet, show me the first from the list
    if ((prefs.currentTask === unknownTask) && (tasks.length >= 1)) {
        if ((!tasks.includes(unknownTask)) && (tasks[0] !== prefs.currentTask)) {
            itemRedirect(tasks[0]);
        };
    }
}

function initPagination () {
    pagination = new Pagination (prefs.pageSize, prefs.pageWindow);
}

function showCurrentTask() {
    // Show the current task
    const taskTitle = document.querySelector (".task-title");
    taskTitle.innerHTML = prefs.currentTask;

    // Any description?
    const currentTask = findCurrentTask();
    if (currentTask) {
        const taskDesc = document.querySelector('.task-desc');
        taskDesc.innerHTML = currentTask.description || "";
    }

    // Set the default value for the input
    document.querySelector("#selectDate").value = dayjs().format("MM/DD/YYYY");
}

function showTaskList () {

    const links = tasks.map(x => `<div class="task-link">${x}</div>`);

    // Add a link for a new task button
    links.push(`<div class="task-link add-task-symbol" data-modal="modal-task">${addTaskSymbol}</div>`);

    //Add them to the list
    const separatorTemplate = '<span class="task-split">|</span>'
    const tasksListDiv = document.querySelector ("#tasksList")
    tasksListDiv.innerHTML = links.join(separatorTemplate);

    // Add the clicks event for each task
    addTasksClicks();
}

function toggleTaskData () {
    if (prefs.currentTask === unknownTask) {
        document.querySelector(".add-task-help").classList.remove("hidden");
        document.querySelector(".add-date-div").classList.add("hidden");
        document.querySelector(".task-data").classList.add("hidden");
    } else {
        document.querySelector(".add-task-help").classList.add("hidden");
        document.querySelector(".add-date-div").classList.remove("hidden");
        document.querySelector(".task-data").classList.remove("hidden");
    }
}

// Logs

function showLogs(){
    const task = findCurrentTask();
    if (task) {
        pagination.itemCount = (task ? task.values.length: 0);
        pagination.page = prefs.currentPage;
        const logTemplate = document.querySelector ("#log-template").innerHTML;
        const dates = task.values.sort().reverse();

        // Show the delta for the last entry
        if (dates.length > 0) {
          const lastDate = dayjs(dates[0]);
          const deltaLast = `Latest entry: ${calcDeltaDate(lastDate)}`;
          document.querySelector (".delta-last").innerHTML = deltaLast;
        }

        // Add the logs, refresh the clicks
        const pageDates = dates.slice(pagination.firstItem, pagination.lastItem + 1);
        const dateList = pageDates.map (x => {
            logDateLabel = dayjs(x).format("MM/DD/YYYY");
            comment = (task[x] && task[x].comment ? task[x].comment : "");
            return logTemplate.supplant({logDate: x, logDateLabel, comment});
        })
        if (dateList.length === 0) {
            dateList.push(`<div class="log log-empty">No entries found. Click "Add" to add a new entry</div>`);
        }
        document.querySelector (".logs").innerHTML = dateList.join("");
        refreshLogClick();
    }
}

function addLogDate () {
    const selectDateInput = document.querySelector("#selectDate")
    const selectedDate = dayjs(selectDateInput.value, "MM/DD/YYYY").format("YYYYMMDD");

    let task = findCurrentTask();
    if (!task) {
        task = { task : prefs.currentTask, values : [ selectedDate ] };
        data.push (task);
    } else {
        if (!task.values.includes(selectedDate)){
            task.values.push(selectedDate);
        }
    }
    saveData ();
    showLogs();
    closeAllModal();
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
    saveData ();
    showLogs();
    closeAllModal();
}

function deleteLog () {

    const editLogDate = document.querySelector('#editLogDate');
    const logDate = editLogDate.innerHTML;

    const task = findCurrentTask();

    if (task) {
        const logEntry = dayjs(logDate).format("YYYYMMDD");
        task.values = task.values.filter(x => x !== logEntry);
        delete task[logEntry];
        saveData ();
        showLogs ();
        closeAllModal();
    }
}

function refreshLogClick () {

  const modals = document.querySelectorAll('[data-modal="modal-edit-log"]');

  modals.forEach(trigger => {
    trigger.addEventListener('click', openModal);
  });
}

// Tasks

function addTask () {
    const taskInput = document.querySelector("[name=newTaskName]");
    const taskDescInput = document.querySelector("[name=taskDesc]");

    const existingTask = data.find (x => x.task === taskInput.value);

    if (!existingTask) {
        const newTask = {
            "task": taskInput.value,
            "description" : taskDescInput.value,
            "values" : []
        }
        data.push (newTask);
        updatePrefs ({ currentTask : taskInput.value})
        saveData ();
        itemRedirect(taskInput.value);
    }
}

function updateTask () {
    const taskInput = document.querySelector("[name=newTaskName]");
    const taskDescInput = document.querySelector("[name=taskDesc]");
    const task = findCurrentTask();

    if (task) {
        task.task = taskInput.value;
        task.description = taskDescInput.value;
        updatePrefs ({ currentTask : taskInput.value})
        saveData ();
        itemRedirect(taskInput.value);
    }
}

function deleteTask () {
    const taskNdx = data.findIndex (x => x.task === prefs.currentTask);
    if (taskNdx !== -1) {
        data.splice(taskNdx, 1);
        saveData ();
        itemRedirect(unknownTask);
    }
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

        const title = document.querySelector("#modal-task .modal-subtitle");

        const taskInput = document.querySelector("[name=newTaskName]");
        const descInput = document.querySelector("[name=taskDesc]");

        const btnUpdate = document.querySelector("#btnUpdateTask");
        const btnAdd = document.querySelector("#btnAddTask");
        const btnDelete = document.querySelector("#btnDeleteTask");

        if (trigger.classList.contains("add-task-symbol")) {
            taskInput.value = "";
            title.innerHTML = "Add Task";
            btnAdd.classList.remove("hidden");
            btnUpdate.classList.add("hidden");
            btnDelete.classList.add("hidden");
        } else { // Update task
            const task = findCurrentTask();
            if (task) {
                taskInput.value = task.task;
                descInput.value = task.description || "";
            } else {
                taskInput.value = prefs.currentTask;
                descInput.value = "";
            }
            title.innerHTML = "Update Task";
            btnAdd.classList.add("hidden");
            btnUpdate.classList.remove("hidden");
            btnDelete.classList.remove("hidden");
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
        const lsDataTextarea = document.querySelector("#lsData");
        lsDataTextarea.classList.remove("invalid"); // Just in case...

        const lsData = document.querySelector('[name="lsData"]');
        lsData.value = localStorage.getItem(LocalStorageKey.data);
    }
}

function addModalClick () {

    const modals = document.querySelectorAll('[data-modal]');

    modals.forEach(trigger => {
      trigger.addEventListener('click', openModal);
    });
}

function openModal (event) {
  event.preventDefault();
  const modal = document.getElementById(event.target.dataset.modal);

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
}

function closeAllModal () {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.remove('open');
    });
}

// Local storage

function saveData () {
    localStorage.setItem(LocalStorageKey.data, JSON.stringify(data));
}

function updatePrefs (prefUpdateObj = {}) {
    prefs = { ...prefs, ...prefUpdateObj };
    localStorage.setItem(LocalStorageKey.prefs, JSON.stringify(prefs));
}

function setLSData() {
    const lsDataTextarea = document.querySelector("#lsData");
    try {
        data = JSON.parse(lsDataTextarea.value);
        saveData ();
        itemRedirect(unknownTask);
    } catch (error) {
        lsDataTextarea.classList.add("invalid");
        console.log(`%cERROR: %cInvalid data.`, "color:red;font-weight:800", "");
    }
}

function copyLSData() {
    // Get the text field
    const lsDataTextarea = document.querySelector("#lsData");

    // Select the text field
    lsDataTextarea.select();
    lsDataTextarea.setSelectionRange(0, 99999); // For mobile devices

     // Copy the text inside the text field
    navigator.clipboard.writeText(lsDataTextarea.value);

    // Alert the copied text
    alert("Copied to Clipboard!");
}

// Pagination

class Pagination {

    constructor (itemPerPage, windowPageAmount) {

        // Will stay the same while browsing pages
        this.itemPerPage = itemPerPage;
        this.windowPageAmount = windowPageAmount; // How many page number will be shown

        this.totalItemCount = 0;
        this.maxPageNumber = 1;

        // Changes based on the current page
        this.currentPage = 1;
        this.firstItem = 0
        this.lastItem = 0;
        this.windowPageMin = 1; // Min value on the page number shown
        this.windowPageMax = 1; // Max value on the page number shown
        this.prev = false; // Can we go backward?
        this.next = false; // Can we go forward?

    }

    set itemCount (totalItemCount) {
        this.totalItemCount = totalItemCount;
        this.maxPageNumber = Math.max(Math.ceil(totalItemCount / this.itemPerPage), 1);
        this.page = prefs.currentPage;
    }

    set page (pageNo) {
        if (pageNo == 0) {
            this.currentPage = 1;
        } else if (pageNo > this.maxPageNumber) {
            this.currentPage = this.maxPageNumber;
        } else {
            this.currentPage = pageNo;
        }
        this.recalculate();
    }

    recalculate (itemPerPage = this.itemPerPage) {
        this.itemPerPage = itemPerPage;
        this.maxPageNumber = Math.max(Math.ceil(this.totalItemCount / this.itemPerPage), 1);
        this.firstItem = (this.currentPage - 1) * this.itemPerPage;
        this.lastItem = Math.min(Math.max(this.totalItemCount,1), this.currentPage * this.itemPerPage) - 1;

        // Now let's calculate the pagination window (for the page toolbar)
        const halfPageWindow = Math.floor(this.windowPageAmount / 2);
        this.windowPageMin = Math.max(this.currentPage - halfPageWindow, 1);
        this.windowPageMax = Math.min(this.windowPageMin + this.windowPageAmount - 1, this.maxPageNumber);

        // Let's try to keep the widest window we can keep...
        if (this.windowPageMax - this.windowPageMin + 1 < this.windowPageAmount) {
            if (this.windowPageMin !== 1 || this.windowPageMax !== this.maxPageNumber) {
                if (this.windowPageMin !== 1) {
                    this.windowPageMin = Math.max(1, this.windowPageMax - this.windowPageAmount + 1);
                } else {
                    this.windowPageMax = Math.min(this.windowPageMin + this.windowPageAmount, this.maxPageNumber);
                }
            }
        }

        // Can we move forward and backward?
        this.prev = this.currentPage > 1;
        this.next = this.currentPage < this.maxPageNumber;
    }

}

function showPagination() {

  const ellipsisButtonTemplate = `<div class="page-ellipsis">...</div>`;
  const inactiveButtonTemplate = `<div class="page-button inactive {classes}">{anchor}</div>`;
  const activeButtonTemplate = ` <div class="page-button {classes}" onclick="gotoPage({gotoPage})"><a href="#">{anchor}</a></div>`;

  const paginators = document.querySelectorAll(".pagination");

  paginators.forEach((pageButtons) => {

    const btnInfo = [];

    btnInfo.push({
      anchor: "&lt;&lt;",
      gotoPage: Math.max(1, pagination.currentPage - pagination.windowPageAmount),
      classes: "",
      template: pagination.prev ? activeButtonTemplate : inactiveButtonTemplate,
    });

    btnInfo.push({
      anchor: "&lt;",
      gotoPage: Math.max(1, pagination.currentPage - 1),
      classes: "",
      template: pagination.prev ? activeButtonTemplate : inactiveButtonTemplate,
    });

    if (pagination.windowPageMin > 1) {
      btnInfo.push({
        anchor: "",
        gotoPage: "",
        classes: "",
        template: ellipsisButtonTemplate,
      });
    }

    for (let i = pagination.windowPageMin; i <= pagination.windowPageMax; i++) {
      btnInfo.push({
        anchor: i,
        gotoPage: i,
        classes: pagination.currentPage === i ? "current-page" : "",
        template: pagination.currentPage === i ? inactiveButtonTemplate : activeButtonTemplate,
      });
    }

    if (pagination.windowPageMax < pagination.maxPageNumber) {
      btnInfo.push({
        anchor: "",
        gotoPage: "",
        classes: "",
        template: ellipsisButtonTemplate,
      });
    }

    btnInfo.push({
      anchor: "&gt;",
      gotoPage: Math.min( pagination.maxPageNumber, pagination.currentPage + 1 ),
      classes: "",
      template: pagination.next ? activeButtonTemplate : inactiveButtonTemplate,
    });

    btnInfo.push({
      anchor: "&gt;&gt;",
      gotoPage: Math.min( pagination.maxPageNumber, pagination.currentPage + pagination.windowPageAmount),
      classes: "",
      template: pagination.next ? activeButtonTemplate : inactiveButtonTemplate,
    });

    // Finally, add the buttons
    const buttons = btnInfo.map((x) => x.template.supplant(x));
    pageButtons.innerHTML = buttons.join("");

  });
}

function gotoPage(pageNumber) {
  updatePrefs({ currentPage: pageNumber });
  pagination.page = pageNumber;
  showPagination();
  showLogs ();
}

function changePageSize (pageSize) {
    updatePrefs({ pageSize, currentPage : 1 });
    pagination.recalculate(pageSize);
    showPagination();
    showLogs ();
}

// Helper function

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

function extractTaskList () {

    tasks = [];

    data.forEach(item => tasks.push(item.task));

    // Add a task to the list if it's not there yet (new task)
    if (prefs.currentTask !== unknownTask) {
        if (prefs.currentTask && !tasks.includes(prefs.currentTask)) {
            tasks.push(prefs.currentTask);
        }
    }

    //Finally, sort the task list
    tasks.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
}

function itemRedirect (task) {
    updatePrefs ({ currentTask : task });
    window.location.reload();
}

function findCurrentTask () {
    return data.find (x => x.task === prefs.currentTask);
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
