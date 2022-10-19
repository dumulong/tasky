const unknownTask = "Unknown";
const addTaskSymbol = "\u2795";

const LocalStorageKey = Object.freeze({
    "data" : "Tasky",
    "prefs" : "Tasky_preferences"
})

// Define the main variables
let prefs = {
    currentTask : "",
    currentPage : 1,
    pageSize : 10,
    pageWindow : 5
};
let data = []; // The local storage data
let tasks = []; // List of tasks

function loadPage () {

    readLocalStorage();
    setDefaultTask ();
    setTaskDescription();
    setUpPage();
    showLogs();
    showPagination();
    addTasksClicks();
    addModalClick();
    
    // Set the default value for the input
    document.querySelector("#selectDate").value = dayjs().format("MM/DD/YYYY");

    // Show the current task
    document.querySelector ("#task").innerHTML = prefs.currentTask;
}

function setUpPage() {
    if (prefs.currentTask === unknownTask) {
        document.querySelector(".add-task-help").classList.remove("hidden");
        document.querySelector(".add-date-div").classList.add("hidden");
    } else {
        document.querySelector(".add-task-help").classList.add("hidden");
        document.querySelector(".add-date-div").classList.remove("hidden");
    }
}

function readLocalStorage () {

    const TaskyPrefLS = localStorage.getItem(LocalStorageKey.prefs);
    const taskyLS = localStorage.getItem(LocalStorageKey.data);

    if (taskyLS) {
        // Extract the data and the task list from the localStorage
        data = JSON.parse(taskyLS)
        data.forEach(item => tasks.push(item.task));
    }

    if (TaskyPrefLS) {
        // Extract the preferences from the localStorage
        try {
            prefs = { ...prefs, ...JSON.parse(TaskyPrefLS) };
        } catch (error) {
            console.log(`%cERROR: %cInvalid preferences.`, "color:red;font-weight:800", "");
        }
    }

    // Add a task if we have one on the search query
    if (prefs.currentTask && !tasks.includes(prefs.currentTask)) {
        tasks.push(prefs.currentTask);
    }
    tasks.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

    if (!prefs.currentTask) {
        prefs.currentTask = tasks[0];
    }

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
    if ((prefs.currentTask === unknownTask) && (tasks.length >= 1)) {
        if ((!tasks.includes(unknownTask)) && (tasks[0] !== prefs.currentTask)) {
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
        const pageStats = calcPage();
        const pageDates = dates.slice(pageStats.min, pageStats.max + 1);
        const dateList = pageDates.map (x => {
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
        if (prefs.currentTask !== unknownTask) {
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
        task = { task : prefs.currentTask, values : [ selectedDate ] };
        data.push (task);
    } else {
        if (!task.values.includes(selectedDate)){
            task.values.push(selectedDate);
        }
    }
    saveData ();
    itemRedirect(prefs.currentTask);
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
    itemRedirect(prefs.currentTask);
}

function deleteLog () {
    const taskNdx = data.findIndex (x => x.task === prefs.currentTask);
    const task = data[taskNdx];
    let redirectTo = prefs.currentTask;

    const editLogDate = document.querySelector('#editLogDate');
    const logDate = editLogDate.innerHTML;

    if (task.values.length === 1) {
        data.splice(taskNdx, 1);
        redirectTo = "";
    } else {
        const logEntry = dayjs(logDate).format("YYYYMMDD");
        task.values = task.values.filter(x => x !== logEntry);
        delete task[logEntry];
        redirectTo = prefs.currentTask;
    }
    saveData ();
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
        saveData ();
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
                taskInput.value = prefs.currentTask;
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
        const lsDataTextarea = document.querySelector("#lsData");
        lsDataTextarea.classList.remove("invalid"); // Just in case...

        const lsData = document.querySelector('[name="lsData"]');
        lsData.value = localStorage.getItem(LocalStorageKey.data);
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
    try {
        data = JSON.parse(lsDataTextarea.value);
        saveData ();
        itemRedirect("");
    } catch (error) {
        lsDataTextarea.classList.add("invalid");
        console.log(`%cERROR: %cInvalid data.`, "color:red;font-weight:800", "");
    }
}

// Helper function
function calcPage() {
  // Get the highest page number
  const task = findCurrentTask();
  const pageMax = Math.max(Math.ceil(task.values.length / prefs.pageSize), 1);

  // Find the current page..
  let currentPage = prefs.currentPage;
  if (!currentPage) {
    currentPage = 1;
  }
  if (currentPage > pageMax) {
    currentPage = pageMax;
  }

  // Save the current page.
  savePrefs({ currentPage: currentPage });

  // Find the index of the first and last item to present
  const min = (currentPage - 1) * prefs.pageSize;
  const max = Math.min(currentPage * prefs.pageSize, task.values.length) - 1;

  // Now let's calculate the pagination window (for the page toolbar)
  const halfPageWindow = Math.floor(prefs.pageWindow / 2);
  let pageWindowMin = Math.max(currentPage - halfPageWindow, 1);
  let pageWindowMax = Math.min(pageWindowMin + prefs.pageWindow - 1, pageMax);

  // Let's try to keep the widest window we can keep...
  if (pageWindowMax - pageWindowMin + 1 < prefs.pageWindow) {
    if (pageWindowMin !== 1 || pageWindowMax !== pageMax) {
      if (pageWindowMin !== 1) {
        pageWindowMin = Math.max(1, pageWindowMax - prefs.pageWindow + 1);
      } else {
        pageWindowMax = Math.min(pageWindowMin + prefs.pageWindow, pageMax);
      }
    }
  }

  return {
    currentPage,
    min,
    max,
    length: data.length,
    breath: max - min + 1, //How many items are we showing?
    pagination: {
      pageWindowMin: pageWindowMin,
      pageWindowMax: pageWindowMax,
      pageMax,
      prev: currentPage > 1,
      next: currentPage < pageMax,
    },
  };
}

function showPagination() {

  const paginators = document.querySelectorAll(".pagination");

  const pageStats = calcPage();

  paginators.forEach((pageButtons) => {
    while (pageButtons.firstChild) {
      pageButtons.removeChild(pageButtons.firstChild);
    }
    btnInfo = [];

    const ellipsisButtonTemplate = `<div class="page-ellipsis">...</div>`;
    const inactiveButtonTemplate = `<div class="page-button inactive {classes}">{anchor}</div>`;
    const activeButtonTemplate = `
        <div class="page-button {classes}" onclick="gotoPage({gotoPage})">
          <a href="#">{anchor}</a>
        </div>`;

    btnInfo.push({
      anchor: "&lt;&lt;",
      gotoPage: Math.max(1, pageStats.currentPage - prefs.pageWindow),
      classes: "",
      template: pageStats.pagination.prev
        ? activeButtonTemplate
        : inactiveButtonTemplate,
    });

    btnInfo.push({
      anchor: "&lt;",
      gotoPage: Math.max(1, pageStats.currentPage - 1),
      classes: "",
      template: pageStats.pagination.prev
        ? activeButtonTemplate
        : inactiveButtonTemplate,
    });

    if (pageStats.pagination.pageWindowMin > 1) {
      btnInfo.push({
        anchor: "",
        gotoPage: "",
        classes: "",
        template: ellipsisButtonTemplate,
      });
    }

    for (
      let i = pageStats.pagination.pageWindowMin;
      i <= pageStats.pagination.pageWindowMax;
      i++
    ) {
      btnInfo.push({
        anchor: i,
        gotoPage: i,
        classes: pageStats.currentPage === i ? "current-page" : "",
        template:
          pageStats.currentPage === i
            ? inactiveButtonTemplate
            : activeButtonTemplate,
      });
    }

    if (pageStats.pagination.pageWindowMax < pageStats.pagination.pageMax) {
      btnInfo.push({
        anchor: "",
        gotoPage: "",
        classes: "",
        template: ellipsisButtonTemplate,
      });
    }

    btnInfo.push({
      anchor: "&gt;",
      gotoPage: Math.min(
        pageStats.pagination.pageMax,
        pageStats.currentPage + 1
      ),
      classes: "",
      template: pageStats.pagination.next
        ? activeButtonTemplate
        : inactiveButtonTemplate,
    });

    btnInfo.push({
      anchor: "&gt;&gt;",
      gotoPage: Math.min(
        pageStats.pagination.pageMax,
        pageStats.currentPage + prefs.pageWindow
      ),
      classes: "",
      template: pageStats.pagination.next
        ? activeButtonTemplate
        : inactiveButtonTemplate,
    });

    // Finally, add the buttons
    const buttons = btnInfo.map((x) => x.template.supplant(x));
    pageButtons.innerHTML = buttons.join("");
  });
}

function gotoPage(pageNumber) {
  if (pageNumber === undefined) {
    const lsPageNumber = localStorage.getItem("current_page");
    pageNumber = lsPageNumber ? parseInt(lsPageNumber) : 1;
    const pageStats = calcPage();
    const max = pageStats.pagination.pageMax;
    if (pageNumber > max) {
      pageNumber = max;
    }
  }
  savePrefs({ currentPage: pageNumber });
  itemRedirect(prefs.currentTask);
}

function changePageSize (pageSize) {
    savePrefs({ pageSize });
    itemRedirect(prefs.currentTask);
}

function saveData () {
    localStorage.setItem(LocalStorageKey.data, JSON.stringify(data));
}

function savePrefs (prefUpdateObj = {}) {
    prefs = { ...prefs, ...prefUpdateObj };
    localStorage.setItem(LocalStorageKey.prefs, JSON.stringify(prefs));
}

function itemRedirect (task) {
    if (!task) { return; }
    savePrefs ({ currentTask : task });
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
