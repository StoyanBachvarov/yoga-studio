// Shared functions for all pages

// Initialize app on page load
document.addEventListener('DOMContentLoaded', () => {
    displayCurrentDate();
    setupEventListeners();
});

// Display current date
function displayCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date();
    document.getElementById('currentDate').textContent = today.toLocaleDateString('en-US', options);
}

// Set up event listeners
function setupEventListeners() {
    const taskForm = document.getElementById('taskForm');
    const editForm = document.getElementById('editForm');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const clearAllBtn = document.getElementById('clearAll');

    if (taskForm) taskForm.addEventListener('submit', addTask);
    if (editForm) editForm.addEventListener('submit', saveEditedTask);
    if (addTaskBtn) addTaskBtn.addEventListener('click', openAddModal);
    if (clearAllBtn) clearAllBtn.addEventListener('click', clearAllTasks);
    
    // Close modals when clicking outside of them
    window.addEventListener('click', (e) => {
        const addModal = document.getElementById('addModal');
        const editModal = document.getElementById('editModal');
        const deleteModal = document.getElementById('deleteModal');
        
        if (e.target === addModal) {
            closeAddModal();
        }
        if (e.target === editModal) {
            closeEditModal();
        }
        if (e.target === deleteModal) {
            closeDeleteModal();
        }
    });
}

// Get tasks from localStorage
function getTasks() {
    const tasksJSON = localStorage.getItem('plannerTasks');
    return tasksJSON ? JSON.parse(tasksJSON) : [];
}

// Add new task
function addTask(e) {
    e.preventDefault();

    const taskName = document.getElementById('taskName').value.trim();
    const priority = document.getElementById('priority').value;
    const category = document.getElementById('category').value;
    const timeframe = getCurrentPageTimeframe();

    if (!taskName || !priority || !timeframe) {
        alert('Please fill in all required fields');
        return;
    }

    const task = {
        id: Date.now(),
        name: taskName,
        priority: priority,
        category: category,
        timeframe: timeframe,
        completed: false,
        createdAt: new Date().toISOString()
    };

    // Get existing tasks from localStorage
    let tasks = getTasks();
    tasks.push(task);

    // Save to localStorage
    localStorage.setItem('plannerTasks', JSON.stringify(tasks));

    // Reset form
    document.getElementById('taskForm').reset();

    // Reload display
    closeAddModal();
    loadAndDisplayTasks();
}

// Load and display tasks
function loadAndDisplayTasks() {
    const tasks = getTasks();
    const timeframe = getCurrentPageTimeframe();
    const filteredTasks = tasks.filter(task => task.timeframe === timeframe);

    // Update statistics
    updateStatistics(filteredTasks);

    // Clear current display
    const tasksList = document.getElementById('tasksList');
    tasksList.innerHTML = '';

    // Display tasks or empty message
    if (filteredTasks.length === 0) {
        tasksList.innerHTML = '<p class="empty-message">No tasks for ' + timeframe.toLowerCase() + '</p>';
    } else {
        filteredTasks.forEach(task => {
            tasksList.appendChild(createTaskElement(task));
        });
    }
}

// Create task element
function createTaskElement(task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = `task-item ${task.completed ? 'completed' : ''}`;
    taskDiv.setAttribute('data-id', task.id);

    // Build meta information
    let metaHTML = `<span class="badge priority-${task.priority.toLowerCase()}">${task.priority}</span>`;
    
    if (task.category) {
        metaHTML += `<span class="badge category-${task.category.toLowerCase()}">${task.category}</span>`;
    }

    taskDiv.innerHTML = `
        <div class="task-content">
            <div class="task-name">${escapeHtml(task.name)}</div>
            <div class="task-meta">
                ${metaHTML}
            </div>
        </div>
        <div class="task-actions">
            <button class="btn-complete" onclick="toggleComplete(${task.id})">
                ${task.completed ? '↩ Undo' : '✓ Done'}
            </button>
            <button class="btn-edit" onclick="openEditModal(${task.id})">Edit</button>
            <button class="btn-delete" onclick="deleteTask(${task.id})">Delete</button>
        </div>
    `;

    return taskDiv;
}

// Toggle task completion status
function toggleComplete(taskId) {
    let tasks = getTasks();
    const task = tasks.find(t => t.id === taskId);

    if (task) {
        task.completed = !task.completed;
        localStorage.setItem('plannerTasks', JSON.stringify(tasks));
        loadAndDisplayTasks();
    }
}

// Open edit modal
let currentEditingTaskId = null;

function openEditModal(taskId) {
    const tasks = getTasks();
    const task = tasks.find(t => t.id === taskId);

    if (task) {
        currentEditingTaskId = taskId;
        
        // Populate form with task data
        document.getElementById('editTaskName').value = task.name;
        document.getElementById('editPriority').value = task.priority;
        document.getElementById('editCategory').value = task.category || '';

        // Show modal
        document.getElementById('editModal').style.display = 'flex';
    }
}

// Close edit modal
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    currentEditingTaskId = null;
    document.getElementById('editForm').reset();
}

// Save edited task
function saveEditedTask(e) {
    e.preventDefault();

    const taskName = document.getElementById('editTaskName').value.trim();
    const priority = document.getElementById('editPriority').value;
    const category = document.getElementById('editCategory').value;

    if (!taskName || !priority) {
        alert('Please fill in all required fields');
        return;
    }

    let tasks = getTasks();
    const taskIndex = tasks.findIndex(t => t.id === currentEditingTaskId);

    if (taskIndex !== -1) {
        tasks[taskIndex].name = taskName;
        tasks[taskIndex].priority = priority;
        tasks[taskIndex].category = category;

        localStorage.setItem('plannerTasks', JSON.stringify(tasks));
        closeEditModal();
        loadAndDisplayTasks();
    }
}

// Delete a task
let currentDeleteTaskId = null;

function deleteTask(taskId) {
    currentDeleteTaskId = taskId;
    document.getElementById('deleteModal').style.display = 'flex';
}

// Close delete modal
function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    currentDeleteTaskId = null;
}

// Confirm delete
function confirmDelete() {
    if (currentDeleteTaskId) {
        let tasks = getTasks();
        tasks = tasks.filter(t => t.id !== currentDeleteTaskId);
        localStorage.setItem('plannerTasks', JSON.stringify(tasks));
        closeDeleteModal();
        loadAndDisplayTasks();
    }
}

// Clear all tasks for current timeframe
function clearAllTasks() {
    const timeframe = getCurrentPageTimeframe();
    if (confirm(`Are you sure you want to delete all tasks in "${timeframe}"? This cannot be undone.`)) {
        let tasks = getTasks();
        tasks = tasks.filter(t => t.timeframe !== timeframe);
        localStorage.setItem('plannerTasks', JSON.stringify(tasks));
        loadAndDisplayTasks();
    }
}

// Open add modal
function openAddModal() {
    document.getElementById('addModal').style.display = 'flex';
}

// Close add modal
function closeAddModal() {
    document.getElementById('addModal').style.display = 'none';
    document.getElementById('taskForm').reset();
}

// Update statistics
function updateStatistics(tasks) {
    const completedCount = tasks.filter(task => task.completed).length;
    const totalCount = tasks.length;
    const percentage = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

    document.getElementById('statsValue').textContent = `${completedCount}/${totalCount}`;
    document.getElementById('statsPercent').textContent = `${percentage}%`;
    document.getElementById('statsProgress').style.width = `${percentage}%`;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Get current page timeframe
function getCurrentPageTimeframe() {
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'today.html' || currentPage === '' || currentPage === 'index.html') {
        return 'Today';
    } else if (currentPage === 'week.html') {
        return 'This week';
    } else if (currentPage === 'month.html') {
        return 'This month';
    }
    return 'Today';
}
