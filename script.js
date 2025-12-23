// --- LOGIKA STREAK ANTI-OVERWRITE (TARUH DI BARIS 1) ---
(function() {
    function hitungDanTampilkanStreak() {
        const today = new Date().toDateString();
        // Ambil data dari penyimpanan berbeda (isolated)
        let data = JSON.parse(localStorage.getItem('final_streak_system'));
        
        if (!data) {
            data = { count: 1, lastDate: today };
        } else {
            if (data.lastDate !== today) {
                const kemarin = new Date();
                kemarin.setDate(kemarin.getDate() - 1);
                
                if (data.lastDate === kemarin.toDateString()) {
                    data.count += 1; // Tambah jika buka tiap hari
                } else {
                    data.count = 1; // Reset jika bolos
                }
                data.lastDate = today;
            }
        }
        
        localStorage.setItem('final_streak_system', JSON.stringify(data));

        // Update ke HTML
        const el = document.getElementById('streakFinal');
        if (el) {
            el.textContent = data.count;
        }
    }

    // Jalankan sekarang
    hitungDanTampilkanStreak();
    
    // Jalankan ulang setiap 2 detik untuk memastikan tidak ditimpa jadi 0 oleh fungsi lain
    setInterval(hitungDanTampilkanStreak, 2000);
})();

// Enhanced InternTrack JavaScript Application
class EnhancedInternTrack {
    constructor() {
        this.logs = JSON.parse(localStorage.getItem('interntrack_logs')) || [];
        this.formVisible = false;
        this.currentFilter = 'all';
        this.initializeEventListeners();
        this.render();
    }

    initializeEventListeners() {
        const logForm = document.getElementById('logForm');
        const editForm = document.getElementById('editForm');
        const typeSelect = document.getElementById('type');
        const projectField = document.getElementById('projectField');
        const filterTabs = document.querySelectorAll('.filter-tab');
        const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');

        logForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addLog();
        });

        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEdit();
        });

        typeSelect.addEventListener('change', (e) => {
            if (e.target.value === 'project') {
                projectField.classList.remove('hidden');
                document.getElementById('project').required = true;
            } else {
                projectField.classList.add('hidden');
                document.getElementById('project').required = false;
                document.getElementById('project').value = '';
            }
        });

        filterTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const filter = e.target.getAttribute('data-filter');
                this.setFilter(filter);
            });
        });

        bulkDeleteBtn.addEventListener('click', () => {
            this.bulkDelete();
        });

        // Event delegation untuk checkbox log
        const logList = document.getElementById('logList');
        logList.addEventListener('change', (e) => {
            if (e.target.classList.contains('log-checkbox')) {
                this.updateBulkDeleteBtn();
            }
        });

        // Set today's date as default
        document.getElementById('date').valueAsDate = new Date();
    }

    setFilter(filter) {
        this.currentFilter = filter;
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        this.render();
    }

    addLog() {
        const date = document.getElementById('date').value;
        const type = document.getElementById('type').value;
        const priority = document.getElementById('priority').value;
        const status = document.getElementById('status').value;
        const project = document.getElementById('project').value.trim();
        const activity = document.getElementById('activity').value.trim();
        const duration = parseFloat(document.getElementById('duration').value);
        const notes = document.getElementById('notes').value.trim();

        if (date && type && priority && status && activity && duration > 0) {
            const newLog = {
                id: Date.now(),
                date: date,
                type: type,
                priority: priority,
                status: status,
                project: project,
                activity: activity,
                duration: duration,
                notes: notes,
                timestamp: new Date().toISOString()
            };

            this.logs.unshift(newLog);
            this.saveToLocalStorage();
            console.log('addLog: log ditambah', newLog);
            this.render(); // Memastikan render langsung
            this.clearForm();
            this.showSuccessToast('Kegiatan berhasil ditambahkan!');
            this.closeAddActivityModal();
        }
    }

    toggleStatus(id) {
        const log = this.logs.find(l => l.id === id);
        if (log) {
            if (log.status === 'completed') {
                log.status = 'pending';
            } else if (log.status === 'pending') {
                log.status = 'in-progress';
            } else {
                log.status = 'completed';
            }
            this.saveToLocalStorage();
            console.log('toggleStatus: status diubah', log);
            this.render(); // Update tampilan
            this.showSuccessToast(`Status berhasil diubah menjadi ${this.getStatusLabel(log.status)}!`);
        }
    }

    editLog(id) {
        const log = this.logs.find(l => l.id === id);
        if (log) {
            document.getElementById('editId').value = log.id;
            document.getElementById('editStatus').value = log.status;
            document.getElementById('editPriority').value = log.priority;
            document.getElementById('editDuration').value = log.duration;
            document.getElementById('editNotes').value = log.notes || '';
            document.getElementById('editModal').classList.add('active');
        }
    }

    saveEdit() {
        const id = parseInt(document.getElementById('editId').value);
        const status = document.getElementById('editStatus').value;
        const priority = document.getElementById('editPriority').value;
        const duration = parseFloat(document.getElementById('editDuration').value);
        const notes = document.getElementById('editNotes').value;

        const log = this.logs.find(l => l.id === id);
        if (log) {
            log.status = status;
            log.priority = priority;
            log.duration = duration;
            log.notes = notes;
            log.lastModified = new Date().toISOString();
            this.saveToLocalStorage();
            this.render(); // Update UI
            this.closeEditModal();
            this.showSuccessToast('Kegiatan berhasil diperbarui!');
        }
    }

    closeEditModal() {
        document.getElementById('editModal').classList.remove('active');
    }

    deleteLog(id) {
        Swal.fire({
            title: 'Hapus kegiatan ini?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                this.logs = this.logs.filter(log => log.id !== id);
                this.saveToLocalStorage();
                this.render();
                Swal.fire('Berhasil!', 'Kegiatan berhasil dihapus!', 'success');
            }
        });
    }

    bulkDelete() {
        const selectedLogs = document.querySelectorAll('.log-checkbox:checked');
        if (selectedLogs.length === 0) {
            Swal.fire('Pilih minimal satu kegiatan untuk dihapus', '', 'info');
            return;
        }
        Swal.fire({
            title: `Hapus ${selectedLogs.length} kegiatan terpilih?`,
            text: 'Data yang dihapus tidak dapat dikembalikan!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                const ids = Array.from(selectedLogs).map(cb => parseInt(cb.dataset.id));
                this.logs = this.logs.filter(log => !ids.includes(log.id));
                this.saveToLocalStorage();
                this.render();
                Swal.fire('Berhasil!', `${selectedLogs.length} kegiatan berhasil dihapus.`, 'success');
            }
        });
    }

    bulkMarkComplete() {
        const selectedLogs = document.querySelectorAll('.log-checkbox:checked');
        if (selectedLogs.length === 0) {
            alert('Pilih minimal satu kegiatan untuk ditandai selesai');
            return;
        }
        selectedLogs.forEach(checkbox => {
            const id = parseInt(checkbox.dataset.id);
            const log = this.logs.find(l => l.id === id);
            if (log) {
                log.status = 'completed';
            }
        });
        this.saveToLocalStorage();
        this.render();
        this.showSuccessToast(`${selectedLogs.length} kegiatan berhasil ditandai selesai!`);
    }

    searchLogs(query) {
        const filteredLogs = this.logs.filter(log => 
            log.activity.toLowerCase().includes(query.toLowerCase()) ||
            log.project?.toLowerCase().includes(query.toLowerCase()) ||
            log.notes?.toLowerCase().includes(query.toLowerCase())
        );
        this.renderFilteredLogs(filteredLogs);
    }

    filterByDateRange(startDate, endDate) {
        const filteredLogs = this.logs.filter(log => {
            const logDate = new Date(log.date);
            return logDate >= new Date(startDate) && logDate <= new Date(endDate);
        });
        this.renderFilteredLogs(filteredLogs);
    }

    renderFilteredLogs(filteredLogs) {
        const logList = document.getElementById('logList');
        const emptyState = document.getElementById('emptyState');
        if (filteredLogs.length === 0) {
            emptyState.style.display = 'block';
            logList.innerHTML = '';
            logList.appendChild(emptyState);
            return;
        }
        emptyState.style.display = 'none';
        logList.innerHTML = '';
        filteredLogs.forEach((log, index) => {
            const logItem = this.createLogCard(log, index);
            logList.appendChild(logItem);
        });
    }

    createLogCard(log, index) {
        const logItem = document.createElement('div');
        logItem.className = `log-card p-6 rounded-2xl slide-in ${log.status === 'completed' ? 'completed' : ''}`;
        logItem.style.animationDelay = `${index * 0.1}s`;
        logItem.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-3 flex-wrap">
                        <input type="checkbox" class="log-checkbox" data-id="${log.id}">
                        <span class="date-badge">${this.formatDate(log.date)}</span>
                        <span class="type-badge ${log.type === 'meeting' ? 'meeting' : ''}">${this.getTypeIcon(log.type)} ${this.getTypeLabel(log.type)}</span>
                        <span class="duration-badge">${log.duration} jam</span>
                        <span class="priority-badge ${log.priority}">${this.getPriorityIcon(log.priority)} ${this.getPriorityLabel(log.priority)}</span>
                        <span class="status-badge ${log.status}">${this.getStatusIcon(log.status)} ${this.getStatusLabel(log.status)}</span>
                    </div>
                    ${log.project ? `<h4 class="text-sm font-bold text-purple-600 mb-1">🚀 Project: ${log.project}</h4>` : ''}
                    <h3 class="text-lg font-bold text-gray-800 mb-2">${log.activity}</h3>
                    ${log.notes ? `<p class="text-gray-600 text-sm mb-2">📝 ${log.notes}</p>` : ''}
                    <p class="text-gray-600 text-sm flex items-center">
                        <span class="mr-2">🕐</span>
                        Ditambahkan ${this.formatTimestamp(log.timestamp)}
                        ${log.lastModified ? ` • Diubah ${this.formatTimestamp(log.lastModified)}` : ''}
                    </p>
                </div>
                <div class="flex flex-col gap-2 ml-4">
                    <button onclick="app.toggleStatus(${log.id})" 
                            class="complete-btn text-white p-2 rounded-full transition duration-200" 
                            title="Ubah Status">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </button>
                    <button onclick="app.editLog(${log.id})" 
                            class="edit-btn text-white p-2 rounded-full transition duration-200" 
                            title="Edit">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                    </button>
                    <button onclick="app.deleteLog(${log.id})" 
                            class="delete-btn text-white p-2 rounded-full transition duration-200" 
                            title="Hapus">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        return logItem;
    }

    saveToLocalStorage() {
        localStorage.setItem('interntrack_logs', JSON.stringify(this.logs));
    }

    clearForm() {
        document.getElementById('activity').value = '';
        document.getElementById('duration').value = '';
        document.getElementById('type').value = '';
        document.getElementById('priority').value = '';
        document.getElementById('status').value = '';
        document.getElementById('project').value = '';
        document.getElementById('notes').value = '';
        document.getElementById('projectField').classList.add('hidden');
        document.getElementById('project').required = false;
        document.getElementById('date').valueAsDate = new Date();
    }

    showSuccessToast(message = '✅ Kegiatan berhasil disimpan!') {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: message,
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
        });
    }

    getTypeLabel(type) {
        const labels = { 'project': 'Project', 'meeting': 'Meeting', 'learning': 'Pembelajaran', 'presentation': 'Presentasi', 'other': 'Lainnya' };
        return labels[type] || type;
    }

    getTypeIcon(type) {
        const icons = { 'project': '🚀', 'meeting': '👥', 'learning': '📚', 'presentation': '📽️', 'other': '📋' };
        return icons[type] || '📋';
    }

    getPriorityLabel(priority) {
        const labels = { 'high': 'Tinggi', 'medium': 'Sedang', 'low': 'Rendah' };
        return labels[priority] || priority;
    }

    getPriorityIcon(priority) {
        const icons = { 'high': '🔥', 'medium': '⚡', 'low': '🌱' };
        return icons[priority] || '⚡';
    }

    getStatusLabel(status) {
        const labels = { 'pending': 'Belum Dimulai', 'in-progress': 'Sedang Dikerjakan', 'completed': 'Selesai' };
        return labels[status] || status;
    }

    getStatusIcon(status) {
        const icons = { 'pending': '⏳', 'in-progress': '🔄', 'completed': '✅' };
        return icons[status] || '⏳';
    }

    filterLogs(filteredLogs) {
        const logList = document.getElementById('logList');
        const emptyState = document.getElementById('emptyState');
        logList.innerHTML = '';
        if (filteredLogs.length === 0) {
            if (emptyState) {
                emptyState.style.display = 'block';
                logList.appendChild(emptyState);
            }
            this.updateBulkDeleteBtn();
            return;
        }
        if (emptyState) emptyState.style.display = 'none';
        filteredLogs.forEach((log, index) => {
            const logItem = this.createLogCard(log, index);
            logList.appendChild(logItem);
        });
        this.updateBulkDeleteBtn();
    }

    renderLogs() {
        let filteredLogs = [...this.logs];
        if (this.currentFilter !== 'all') {
            if (this.currentFilter === 'high') {
                filteredLogs = filteredLogs.filter(log => log.priority === 'high');
            } else {
                filteredLogs = filteredLogs.filter(log => log.status === this.currentFilter);
            }
        }
        this.filterLogs(filteredLogs);
        this.updateBulkDeleteBtn();
    }

    renderStats() {
        const totalLogs = this.logs.length;
        const totalHours = this.logs.reduce((sum, log) => sum + log.duration, 0);
        const completedTasks = this.logs.filter(log => log.status === 'completed').length;

        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        startOfWeek.setHours(0, 0, 0, 0);
        const thisWeekHours = this.logs
            .filter(log => new Date(log.date) >= startOfWeek)
            .reduce((sum, log) => sum + log.duration, 0);

        const progressPercent = totalLogs > 0 ? Math.round((completedTasks / totalLogs) * 100) : 0;

        document.getElementById('totalLogs').textContent = totalLogs;
        document.getElementById('totalHours').textContent = totalHours.toFixed(1);
        document.getElementById('completedTasks').textContent = completedTasks;
        document.getElementById('thisWeek').textContent = thisWeekHours.toFixed(1);
        document.getElementById('progressPercent').textContent = progressPercent + '%';
        document.getElementById('progressFill').style.width = progressPercent + '%';
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('id-ID', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    formatTimestamp(timestamp) {
        return new Date(timestamp).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    render() {
        console.log('Render dipanggil, logs:', this.logs, 'filter:', this.currentFilter);
        this.renderLogs();
        this.renderStats();
    }

    updateBulkDeleteBtn() {
        const btn = document.getElementById('bulkDeleteBtn');
        if (!btn) return;
        const checked = document.querySelectorAll('.log-checkbox:checked').length;
        btn.style.display = checked > 0 ? '' : 'none';
    }

    // Modal functions for Add Activity
    openAddActivityModal() {
        const modal = document.getElementById('addActivityModal');
        modal.classList.add('active');
        // Set today's date as default
        document.getElementById('date').valueAsDate = new Date();
        // Focus on first input
        setTimeout(() => {
            document.getElementById('date').focus();
        }, 300);
    }

    closeAddActivityModal() {
        const modal = document.getElementById('addActivityModal');
        modal.classList.remove('active');
        this.clearForm();
    }
}

// Global functions for modal
function openAddActivityModal() {
    if (window.app) {
        window.app.openAddActivityModal();
    }
}

function closeAddActivityModal() {
    if (window.app) {
        window.app.closeAddActivityModal();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new EnhancedInternTrack();
    
    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const activeModal = document.querySelector('.modal.active');
            if (activeModal) {
                activeModal.classList.remove('active');
                if (activeModal.id === 'addActivityModal') {
                    window.app.clearForm();
                }
            }
        }
    });

    // Close subjectModal (index.html) when clicking outside modal-content
    const subjectModal = document.getElementById('subjectModal');
    if(subjectModal) {
        subjectModal.addEventListener('click', function(e) {
            if(e.target === subjectModal) {
                closeSubjectModal();
            }
        });
    }
});

//index.html

        // Global variables
        let currentUser = null;
        let studyData = {
            subjects: [],
            studyTime: 0,
            streak: 0,
            goals: []
        };
        let timerInterval = null;
        let timerMinutes = 25;
        let timerSeconds = 0;
        let isTimerRunning = false;
        let currentMonth = new Date().getMonth();
        let currentYear = new Date().getFullYear();
        // Tambahkan audio bell
        const bellAudio = new Audio('bell100.mp3');

        // Harus dikaitkan dengan interaksi pengguna
        document.addEventListener('click', () => {
        bellAudio.play().then(() => {
            bellAudio.pause();
            bellAudio.currentTime = 0;
            console.log("Audio diaktifkan di GitHub Pages setelah klik.");
        }).catch((err) => {
            console.warn("Gagal aktifkan audio:", err);
        });
        }, { once: true });


        // Initialize on page load
        document.addEventListener('DOMContentLoaded', function() {
            loadUserData();
            if (currentUser) {
                document.getElementById('nameModal').classList.remove('show');
                initializeApp();
            }
            window.lastContinuedSubjectName = null;
            window.lastContinuedSubjectIndex = null;
            updateActiveSubjectName();
            renderFAQQuestions(); // Render FAQ questions when the page loads
        });

        // Name input handling
        function handleNameKeyPress(event) {
            if (event.key === 'Enter') {
                saveName();
            }
        }

        function saveName() {
            const nameInput = document.getElementById('nameInput');
            const name = nameInput.value.trim();
            
            if (name) {
                currentUser = name;
                localStorage.setItem('eduMentorUser', name);
                document.getElementById('nameModal').classList.remove('show');
                showNotification(`Selamat datang, ${name}! `);
                initializeApp();
            } else {
                showNotification('Silakan masukkan nama Anda terlebih dahulu', 'error');
            }
        }

        function loadUserData() {
            const savedUser = localStorage.getItem('eduMentorUser');
            if (savedUser) {
                currentUser = savedUser;
                const savedData = localStorage.getItem(`eduMentorData_${savedUser}`);
                if (savedData) {
                    studyData = JSON.parse(savedData);
                    // Patch: pastikan setiap subject punya targetTime
                    if (studyData.subjects && Array.isArray(studyData.subjects)) {
                        studyData.subjects.forEach(subject => {
                            if (!subject.targetTime || isNaN(parseFloat(subject.targetTime))) {
                                subject.targetTime = subject.studyTime || 25;
                            }
                            if (!subject.totalTime || isNaN(parseFloat(subject.totalTime))) {
                                subject.totalTime = 0;
                            }
                            if (!subject.lastMilestone || isNaN(parseFloat(subject.lastMilestone))) {
                                subject.lastMilestone = 0;
                            }
                            if (!subject.runningTimerElapsed || isNaN(parseFloat(subject.runningTimerElapsed))) {
                                subject.runningTimerElapsed = 0;
                            }
                        });
                    }
                }
            }
            window.studyData = studyData; // <-- Tambahkan ini
        }

        function saveUserData() {
            if (currentUser) {
                localStorage.setItem(`eduMentorData_${currentUser}`, JSON.stringify(studyData));
            }
            window.studyData = studyData; // <-- Tambahkan ini
        }

        function initializeApp() {
            document.getElementById('userName').textContent = currentUser;
            updateDashboard();
            generateCalendar();
            loadAIRecommendations();
        }

        // Tab switching
        function showTab(tabName) {
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });
            document.getElementById(tabName).classList.add('active');
            event.target.classList.add('active');
            if (tabName === 'learning-path') {
                updateLearningPath();
            }
            if (tabName === 'study-planner') {
                initializeStudyPlanner();
            }
        }

        // Subject management
        function openSubjectModal() {
            document.getElementById('subjectModal').classList.add('show');
        }

        function closeSubjectModal() {
            document.getElementById('subjectModal').classList.remove('show');
            document.getElementById('subjectName').value = '';
            document.getElementById('subjectDescription').value = '';
            document.getElementById('subjectDifficulty').value = 'beginner';
            document.getElementById('subjectTime').value = 25; // Reset timer option
        }

        // 2. Update progress calculation and milestone logic in updateTimer
        function addNewSubject() {
            const name = document.getElementById('subjectName').value.trim();
            const description = document.getElementById('subjectDescription').value.trim();
            const difficulty = document.getElementById('subjectDifficulty').value;
            const time = parseInt(document.getElementById('subjectTime').value);
            // Cek nama subject sudah ada (case-insensitive)
            const nameExists = studyData.subjects.some(s => s.name.trim().toLowerCase() === name.toLowerCase());
            if (nameExists) {
                Swal.fire('Gagal', 'Nama topik pembelajaran sudah ada, gunakan nama lain!', 'error');
                return;
            }
            if (name && description && time > 0) {
                const newSubject = {
                    name: name,
                    description: description,
                    difficulty: difficulty,
                    progress: 0,
                    totalTime: 0,
                    completed: false,
                    studyTime: time,
                    targetTime: time,
                    lastMilestone: 0, // milestone progress
                    runningTimerElapsed: 0,
                    timestamp: Date.now() // Add timestamp for sorting
                };
                studyData.subjects.push(newSubject);
                saveUserData();
                closeSubjectModal();
                // Reset to first page when adding new subject
                window.currentSchedulePage = 1;
                updateDashboard();
                showNotification(`Topik pembelajaran "${name}" berhasil ditambahkan! 📚`);
            } else {
                showNotification('Silakan lengkapi semua field', 'error');
            }
        }

        // Dashboard updates
        function updateDashboard() {
            updateMetrics();
            updateTodaySchedule();
            updatePrioritySubjects();
        }

        function updateMetrics() {
            const totalSubjects = studyData.subjects.length;
            const completedSubjects = studyData.subjects.filter(s => s.completed).length;
            const overallProgress = totalSubjects > 0 ? 
                Math.round(studyData.subjects.reduce((sum, s) => sum + s.progress, 0) / totalSubjects) : 0;
            
            document.getElementById('overallProgress').textContent = `${overallProgress}%`;
            document.getElementById('completedCourses').textContent = completedSubjects;
            document.getElementById('studyTime').textContent = `${Math.round(studyData.studyTime / 60)}h`;
            document.getElementById('studyStreak').textContent = studyData.streak;
        }

        // 3. On dashboard render, always use lastMilestone as minimum progress
        function updateTodaySchedule() {
            const scheduleContainer = document.getElementById('todaySchedule');
            scheduleContainer.innerHTML = '';
            
            if (studyData.subjects.length === 0) {
                scheduleContainer.innerHTML = `
                    <div class="text-center py-8">
                        <p class="text-gray-500">Belum ada topik pembelajaran. Klik "Tambah Topik Pembelajaran" untuk menambahkan.</p>
                    </div>
                `;
                // Sembunyikan tombol aksi jika tidak ada subject
                const actions = document.getElementById('selectedActions');
                if (actions) actions.style.display = 'none';
                return;
            }
            
            // Siapkan array untuk menampung id subject terpilih
            if (!window.selectedSubjectIndexes) window.selectedSubjectIndexes = [];
            
            // Sort subjects: newest first (by creation time or add timestamp)
            const sortedSubjects = [...studyData.subjects].sort((a, b) => {
                // If subjects have timestamp, sort by timestamp, otherwise keep original order
                if (a.timestamp && b.timestamp) {
                    return b.timestamp - a.timestamp;
                }
                // For existing subjects without timestamp, newer ones (higher index) come first
                return studyData.subjects.indexOf(b) - studyData.subjects.indexOf(a);
            });
            
            // Pagination variables
            const itemsPerPage = 5;
            const currentPage = window.currentSchedulePage || 1;
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginatedSubjects = sortedSubjects.slice(startIndex, endIndex);
            
            // Render paginated subjects
            paginatedSubjects.forEach((subject, displayIndex) => {
                const originalIndex = studyData.subjects.indexOf(subject);
                const scheduleItem = document.createElement('div');
                let totalTime = (parseFloat(subject.totalTime) || 0) + (parseFloat(subject.runningTimerElapsed) || 0);
                let targetTime = parseFloat(subject.targetTime);
                if (!targetTime || isNaN(targetTime)) targetTime = 25;
                let progressRaw = (totalTime / targetTime) * 100;
                let progress = Math.floor(progressRaw);
                if (progress > 100) progress = 100;
                if (progress < 0 || isNaN(progress)) progress = 0;
                // Use lastMilestone as minimum progress
                if (subject.lastMilestone && progress < subject.lastMilestone) {
                    progress = subject.lastMilestone;
                }
                subject.progress = progress;
                subject.completed = (progress === 100);
                scheduleItem.className = 'learning-path-item p-4 mb-4';
                scheduleItem.setAttribute('data-subject-name', subject.name); // Tambahkan atribut unik
                if (subject.completed) scheduleItem.classList.add('completed');
                // Checkbox centang
                const checked = window.selectedSubjectIndexes.includes(originalIndex) ? 'checked' : '';
                scheduleItem.innerHTML = `
                    <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2">
                            <input type="checkbox" onchange="toggleSelectSubject(${originalIndex})" ${checked} style="margin-right:8px;transform:scale(1.2);" />
                            <div>
                                <h4 class="font-bold text-gray-800">${subject.name}</h4>
                                <p class="text-sm text-gray-600">${subject.description}</p>
                                <div class="flex items-center space-x-2 mt-2">
                                    <span class="skill-badge">${subject.difficulty}</span>
                                    <span class="text-sm text-gray-500">Target: ${subject.targetTime || subject.studyTime || 25} menit</span>
                                </div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-2xl font-bold text-purple-600">${progress}%</div>
                            <div class="w-20 h-2 bg-gray-200 rounded-full mt-2">
                                <div class="h-full bg-purple-600 rounded-full" style="width: ${progress}%"></div>
                            </div>
                            <button class="btn-primary mt-2" onclick="continueStudy('${subject.name}')">Lanjutkan</button>
                        </div>
                    </div>
                `;
                
                scheduleContainer.appendChild(scheduleItem);
            });
            
            // Add pagination controls
            const totalPages = Math.ceil(sortedSubjects.length / itemsPerPage);
            if (totalPages > 1) {
                const paginationDiv = document.createElement('div');
                paginationDiv.className = 'flex justify-center items-center space-x-2 mt-6';
                paginationDiv.innerHTML = `
                    <button class="btn-primary" onclick="changeSchedulePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''} style="${currentPage === 1 ? 'opacity: 0.5; cursor: not-allowed;' : ''}">❮ Sebelumnya</button>
                    <span class="text-gray-600 font-medium">Halaman ${currentPage} dari ${totalPages}</span>
                    <button class="btn-primary" onclick="changeSchedulePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''} style="${currentPage === totalPages ? 'opacity: 0.5; cursor: not-allowed;' : ''}">Selanjutnya ❯</button>
                `;
                scheduleContainer.appendChild(paginationDiv);
            }
            
            // Tampilkan/sembunyikan tombol aksi sesuai jumlah centang
            const actions = document.getElementById('selectedActions');
            if (actions) {
                if (window.selectedSubjectIndexes.length > 0) {
                    actions.style.display = '';
                } else {
                    actions.style.display = 'none';
                }
            }
        }

        function updatePrioritySubjects() {
            const prioritySelect = document.getElementById('prioritySubject');
            if (!prioritySelect) return;
            prioritySelect.innerHTML = '';
            
            studyData.subjects.forEach(subject => {
                const option = document.createElement('option');
                option.value = subject.name;
                option.textContent = subject.name;
                prioritySelect.appendChild(option);
            });
        }

        class RobustTimer {
            constructor() {
                this.startTime = null;
                this.duration = 0; // in seconds
                this.isRunning = false;
                this.intervalId = null;
                this.callbacks = {
                    onTick: null,
                    onComplete: null,
                    onUpdate: null
                };
            }
        
            start(durationMinutes, callbacks = {}) {
                this.duration = durationMinutes * 60; // Convert to seconds
                this.startTime = Date.now();
                this.isRunning = true;
                this.callbacks = { ...this.callbacks, ...callbacks };
                
                // Start the display update interval
                this.intervalId = setInterval(() => {
                    this.updateDisplay();
                }, 100); // Update every 100ms for smooth display
                
                this.updateDisplay();
            }
        
            updateDisplay() {
                if (!this.isRunning) return;
                
                const now = Date.now();
                const elapsed = Math.floor((now - this.startTime) / 1000); // seconds elapsed
                const remaining = Math.max(0, this.duration - elapsed);
                
                const minutes = Math.floor(remaining / 60);
                const seconds = remaining % 60;
                
                // Call the tick callback with time data
                if (this.callbacks.onTick) {
                    this.callbacks.onTick({
                        minutes,
                        seconds,
                        elapsed,
                        remaining,
                        isComplete: remaining === 0
                    });
                }
                
                // Check if timer is complete
                if (remaining === 0) {
                    this.complete();
                }
            }
        
            complete() {
                this.isRunning = false;
                if (this.intervalId) {
                    clearInterval(this.intervalId);
                    this.intervalId = null;
                }
                
                if (this.callbacks.onComplete) {
                    this.callbacks.onComplete();
                }
            }
        
            stop() {
                this.isRunning = false;
                if (this.intervalId) {
                    clearInterval(this.intervalId);
                    this.intervalId = null;
                }
            }
        
            reset() {
                this.stop();
                this.startTime = null;
                this.duration = 0;
            }
        
            getElapsedTime() {
                if (!this.startTime) return 0;
                return Math.floor((Date.now() - this.startTime) / 1000);
            }
        
            getRemainingTime() {
                if (!this.startTime) return 0;
                const elapsed = this.getElapsedTime();
                return Math.max(0, this.duration - elapsed);
            }
        }
        
        // Modified implementation for your EduMentor app
        let robustTimer = new RobustTimer();
        
        // Replace your existing timer functions with these:
        function startTimer() {
            if (robustTimer.isRunning) return;
            
            const selectedDuration = parseInt(document.getElementById('timerSelect').value) || 25;
            
            document.getElementById('timerBtn').style.display = 'none';
            document.getElementById('timerSelect').disabled = true;
            
            robustTimer.start(selectedDuration, {
                onTick: (timeData) => {
                    // Update display
                    const display = `${timeData.minutes.toString().padStart(2, '0')}:${timeData.seconds.toString().padStart(2, '0')}`;
                    document.getElementById('timerDisplay').textContent = display;
                    
                    // Update subject progress (your existing logic)
                    updateSubjectProgress(timeData.elapsed / 60); // Convert to minutes
                },
                onComplete: () => {
                    // Timer completed
                    if (typeof bellAudio !== 'undefined' && bellAudio) {
                        bellAudio.play();
                    }
                    
                    // Save progress and reset
                    if (typeof window.lastContinuedSubjectIndex === 'number' && studyData.subjects[window.lastContinuedSubjectIndex]) {
                        const subject = studyData.subjects[window.lastContinuedSubjectIndex];
                        subject.totalTime += subject.runningTimerElapsed || 0;
                        subject.runningTimerElapsed = 0;
                        saveUserData();
                    }
                    
                    resetTimer();
                    showNotification('Sesi selesai! Istirahat! ');
                    updateMetrics();
                    updateDashboard();
                }
            });
        }
        // Enhanced resetTimer function with milestone-based progress reset
        function resetTimer() {
            robustTimer.reset();
            const defaultDuration = 25;
            document.getElementById('timerDisplay').textContent = `${defaultDuration.toString().padStart(2, '0')}:00`;
            document.getElementById('timerBtn').style.display = 'block';
            document.getElementById('timerSelect').disabled = false;

            if (typeof window.lastContinuedSubjectIndex === 'number' && studyData.subjects[window.lastContinuedSubjectIndex]) {
                const subject = studyData.subjects[window.lastContinuedSubjectIndex];
                // Jika progress sudah 100%, reset di timer tidak boleh dilakukan
                if (subject.completed && subject.progress >= 100) {
                    showNotification('🏆 Topik sudah selesai 100%. Reset hanya bisa dari jadwal harian!');
                    return;
                }
                subject.runningTimerElapsed = 0;
                saveUserData();
            }

            window.lastContinuedSubjectName = null;
            window.lastContinuedSubjectIndex = null;
            updateActiveSubjectName();
            updateDashboard();
        }
        
// Enhanced updateSubjectProgress with milestone notifications
        function updateSubjectProgress(elapsedMinutes) {
            if (typeof window.lastContinuedSubjectIndex === 'number' && studyData.subjects[window.lastContinuedSubjectIndex]) {
                const subject = studyData.subjects[window.lastContinuedSubjectIndex];
                let targetTime = parseFloat(subject.targetTime);
                if (!targetTime || isNaN(targetTime)) targetTime = 25;
                
                subject.runningTimerElapsed = elapsedMinutes;
                let totalTime = (parseFloat(subject.totalTime) || 0) + (parseFloat(subject.runningTimerElapsed) || 0);
                let progressRaw = (totalTime / targetTime) * 100;
                let progress = Math.floor(progressRaw);
                if (progress > 100) progress = 100;
                if (progress < 0 || isNaN(progress)) progress = 0;
                
        // Initialize milestone tracking if not exists
        if (!subject._milestoneNotified) subject._milestoneNotified = {};
        
        // Check for milestone achievements with encouraging messages
                const milestones = [25, 50, 75, 100];
        milestones.forEach(milestone => {
            if (progress >= milestone && !subject._milestoneNotified[milestone]) {
                let message = '';
                switch(milestone) {
                    case 25:
                        message = ` Selamat! Anda telah menyelesaikan 25% dari target belajar ${subject.name}! Terus semangat!`;
                        break;
                    case 50:
                        message = `🌟 Luar biasa! Anda sudah mencapai 50% dari target belajar ${subject.name}! Setengah jalan sudah ditempuh!`;
                        break;
                    case 75:
                        message = `🚀 Keren! Anda telah menyelesaikan 75% dari target belajar ${subject.name}! Sedikit lagi menuju 100%!`;
                        break;
                    case 100:
                        message = `🏆 Fantastis! Anda telah menyelesaikan 100% target belajar ${subject.name}! Pembelajaran selesai!`;
                        break;
                }
                
                showNotification(message);
                
                // Play bell sound for completion
                if (milestone === 100 && typeof bellAudio !== 'undefined' && bellAudio) {
                            bellAudio.play();
                        }
                
                subject._milestoneNotified[milestone] = true;
            }
            
            // Reset flag if progress drops below milestone (for edge cases)
            if (progress < milestone && subject._milestoneNotified[milestone]) {
                subject._milestoneNotified[milestone] = false;
            }
        });
                
                subject.progress = progress;
        subject.completed = (progress >= 100);
                
        // Stop timer if completed
                if (subject.completed) {
                    robustTimer.stop();
                    document.getElementById('timerBtn').style.display = 'block';
                    document.getElementById('timerSelect').disabled = false;
                }
                
                updateDOMProgress(subject.name, progress);
                saveUserData();
            }
        }
        
// Enhanced updateDOMProgress with visual feedback
        function updateDOMProgress(subjectName, progress) {
            const scheduleContainer = document.getElementById('todaySchedule');
            if (scheduleContainer && window.lastContinuedSubjectName) {
                const card = scheduleContainer.querySelector(`.learning-path-item[data-subject-name="${window.lastContinuedSubjectName}"]`);
                if (card) {
                    const percentEl = card.querySelector('.text-2xl.font-bold.text-purple-600');
            if (percentEl) {
                percentEl.textContent = progress + '%';
                
                // Add visual feedback for milestones
                if (progress >= 75) {
                    percentEl.style.color = '#10b981'; // Green for 75%+
                } else if (progress >= 50) {
                    percentEl.style.color = '#f59e0b'; // Yellow for 50%+
                } else if (progress >= 25) {
                    percentEl.style.color = '#3b82f6'; // Blue for 25%+
                } else {
                    percentEl.style.color = '#8b5cf6'; // Purple for <25%
                }
            }
                    
                    const barEl = card.querySelector('.h-full.bg-purple-600.rounded-full');
            if (barEl) {
                barEl.style.width = progress + '%';
                
                // Add gradient colors based on progress
                if (progress >= 75) {
                    barEl.style.background = 'linear-gradient(45deg, #10b981, #065f46)';
                } else if (progress >= 50) {
                    barEl.style.background = 'linear-gradient(45deg, #f59e0b, #d97706)';
                } else if (progress >= 25) {
                    barEl.style.background = 'linear-gradient(45deg, #3b82f6, #1d4ed8)';
                } else {
                    barEl.style.background = 'linear-gradient(45deg, #8b5cf6, #7c3aed)';
                }
            }
            
            // Update card styling for completed subjects
            if (progress >= 100) {
                card.classList.add('completed');
                card.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.3)';
            } else {
                card.classList.remove('completed');
                card.style.boxShadow = '';
            }
        }
    }
}

// Enhanced startTimer function
function startTimer() {
    if (robustTimer.isRunning) return;
    
    // Check if current subject is already completed
    if (typeof window.lastContinuedSubjectIndex === 'number' && studyData.subjects[window.lastContinuedSubjectIndex]) {
        const subject = studyData.subjects[window.lastContinuedSubjectIndex];
        if (subject.completed && subject.progress >= 100) {
            showNotification('🏆 Subjek ini sudah selesai 100%! Pilih subjek lain atau reset di jadwal jika perlu.');
            return;
        }
    }
    
    const selectedDuration = parseInt(document.getElementById('timerSelect').value) || 25;
    document.getElementById('timerBtn').style.display = 'none';
    document.getElementById('timerSelect').disabled = true;
    
    // Show start notification
    if (window.lastContinuedSubjectName) {
        showNotification(`Timer dimulai untuk ${window.lastContinuedSubjectName}! Fokus dan semangat belajar! 🎯`);
    } else {
        showNotification('Timer belajar dimulai! Tetap fokus dan semangat! ⏰');
    }
    
    updateActiveSubjectName();
    
    robustTimer.start(selectedDuration, {
        onTick: (timeData) => {
            const display = `${timeData.minutes.toString().padStart(2, '0')}:${timeData.seconds.toString().padStart(2, '0')}`;
            document.getElementById('timerDisplay').textContent = display;
            updateSubjectProgress(timeData.elapsed / 60);
        },
        onComplete: () => {
            // Play completion sound
            if (typeof bellAudio !== 'undefined' && bellAudio) {
                bellAudio.play();
            }
            
            // Save completed session
            if (typeof window.lastContinuedSubjectIndex === 'number' && studyData.subjects[window.lastContinuedSubjectIndex]) {
                const subject = studyData.subjects[window.lastContinuedSubjectIndex];
                subject.totalTime = (parseFloat(subject.totalTime) || 0) + (parseFloat(subject.runningTimerElapsed) || 0);
                subject.runningTimerElapsed = 0;
                saveUserData();
            }
            
            resetTimer();
            showNotification(' Sesi belajar selesai! Waktunya istirahat sejenak. Great job!');
            updateMetrics();
            updateDashboard();
        }
    });
}

// Enhanced notification system
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
    notification.style.maxWidth = '400px';
    notification.innerHTML = `
        <div class="flex items-center space-x-3">
            <div class="text-2xl"></div>
            <div class="flex-1">
                <div class="font-semibold">Notifikasi Belajar</div>
                <div class="text-sm opacity-90">${message}</div>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="text-white hover:text-gray-200">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(full)';
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}

// Enhanced updateActiveSubjectName function
function updateActiveSubjectName() {
    const el = document.getElementById('activeSubjectName');
    if (!el) return;
    
    if (window.lastContinuedSubjectName) {
        el.textContent = `Sedang belajar: ${window.lastContinuedSubjectName}`;
        el.style.color = '#10b981'; // Green when active
    } else {
        el.textContent = 'Pilih topik pembelajaran untuk memulai';
        el.style.color = '#6b7280'; // Gray when inactive
    }
}

// Timer duration change function
        function changeTimerDuration() {
            const newDuration = parseInt(document.getElementById('timerSelect').value);
            document.getElementById('timerDisplay').textContent = `${newDuration.toString().padStart(2, '0')}:00`;
        }
        
        // Enhanced Page Visibility API for better handling
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                // Tab became inactive - timer continues running automatically
                console.log('Tab inactive - timer continues in background');
            } else {
                // Tab became active - force display update
                console.log('Tab active - syncing timer display');
                if (robustTimer.isRunning) {
                    robustTimer.updateDisplay();
                }
            }
        });
        
        // Additional recovery mechanism on focus
        window.addEventListener('focus', function() {
            if (robustTimer.isRunning) {
                robustTimer.updateDisplay();
            }
        });
        
        // Periodic sync every 5 seconds as backup
        setInterval(() => {
            if (robustTimer.isRunning) {
                robustTimer.updateDisplay();
            }
        }, 5000);

// Chat function
        function addMessageToChat(message, sender) {
            const chatContainer = document.getElementById('chatContainer');
            const messageDiv = document.createElement('div');
            messageDiv.className = `chat-bubble ${sender}-message`;
            
            if (sender === 'user') {
                messageDiv.innerHTML = `
                    <div class="text-right">
                        <div class="font-semibold text-white mb-1">${currentUser}</div>
                        <div class="text-white">${message}</div>
                    </div>
                `;
            } else {
                messageDiv.innerHTML = `
                    <div class="flex items-start space-x-3">
                        <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span class="text-white text-sm">🤖</span>
                        </div>
                        <div>
                            <div class="font-semibold text-gray-800 mb-1">EduMentor Chatbot</div>
                            <div class="text-gray-700">${message}</div>
                        </div>
                    </div>
                `;
            }
            
            chatContainer.appendChild(messageDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
// Enhanced Calendar and Study Planner Code - v3.0
// More robust initialization and form handling

(function() {
    'use strict';
    
    // Initialize calendar-specific variables with error handling
    if (!window.calendarData) {
        window.calendarData = {
            currentMonth: new Date().getMonth(),
            currentYear: new Date().getFullYear(),
            studyPlans: {},
            initialized: false
        };
    }
    
    console.log('Calendar module loaded');
})();

// Enhanced storage functions with validation
function loadCalendarStudyPlans() {
    try {
        // Ambil dari localStorage
        const saved = localStorage.getItem('calendar_studyPlans');
        if (saved) {
            window.calendarData.studyPlans = JSON.parse(saved);
        } else {
            window.calendarData.studyPlans = {};
        }
        console.log('Calendar study plans loaded from localStorage:', window.calendarData.studyPlans);
        return true;
    } catch (error) {
        console.error('Error loading calendar study plans:', error);
        window.calendarData.studyPlans = {};
        return false;
    }
}

function saveCalendarStudyPlans() {
    try {
        // Simpan ke localStorage
        localStorage.setItem('calendar_studyPlans', JSON.stringify(window.calendarData.studyPlans));
        console.log('Calendar study plans saved to localStorage:', window.calendarData.studyPlans);
        return true;
    } catch (error) {
        console.error('Error saving calendar study plans:', error);
        return false;
    }
}

// Enhanced utility functions
function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
        const [y, m, d] = dateStr.split('-');
        return `${parseInt(d)} ${months[parseInt(m)-1]} ${y}`;
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateStr;
    }
}

function showCalendarNotification(message, type = 'success') {
    try {
        let notification = document.getElementById('calendarNotification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'calendarNotification';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(45deg, #667eea, #764ba2);
                color: white;
                padding: 12px 24px;
                border-radius: 12px;
                z-index: 1000;
                font-weight: 600;
                box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
                transform: translateX(400px);
                transition: transform 0.3s ease;
                max-width: 300px;
                word-wrap: break-word;
            `;
            document.body.appendChild(notification);
        }
        
        // Change color based on type
        if (type === 'error') {
            notification.style.background = 'linear-gradient(45deg, #ff6b6b, #ee5a52)';
        } else if (type === 'warning') {
            notification.style.background = 'linear-gradient(45deg, #ffc107, #fd7e14)';
        } else {
            notification.style.background = 'linear-gradient(45deg, #667eea, #764ba2)';
        }
        
        notification.textContent = message;
        notification.style.transform = 'translateX(0)';
        
        setTimeout(() => { 
            notification.style.transform = 'translateX(400px)'; 
        }, 4000);
        
    } catch (error) {
        console.error('Error showing notification:', error);
        // Fallback to alert if notification fails
        alert(message);
    }
}

// Enhanced calendar generation with error handling
        function generateCalendar() {
    try {
            const calendarGrid = document.getElementById('calendarGrid');
        const calendarMonth = document.getElementById('calendarMonth');
        
        if (!calendarGrid || !calendarMonth) {
            console.warn('Calendar elements not found - deferring generation');
            // Retry after a short delay
            setTimeout(generateCalendar, 500);
            return;
        }
        
        const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
        calendarMonth.textContent = `${monthNames[window.calendarData.currentMonth]} ${window.calendarData.currentYear}`;
        
        const firstDay = new Date(window.calendarData.currentYear, window.calendarData.currentMonth, 1).getDay();
        const daysInMonth = new Date(window.calendarData.currentYear, window.calendarData.currentMonth + 1, 0).getDate();
            
            calendarGrid.innerHTML = '';
            
        // Add day headers
            const dayHeaders = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
            dayHeaders.forEach(day => {
                const headerDiv = document.createElement('div');
            headerDiv.className = 'calendar-day font-bold text-gray-600 text-center py-2';
                headerDiv.textContent = day;
                calendarGrid.appendChild(headerDiv);
            });
            
        // Add empty cells for days before the first day
            for (let i = 0; i < firstDay; i++) {
                const emptyDiv = document.createElement('div');
                emptyDiv.className = 'calendar-day';
                calendarGrid.appendChild(emptyDiv);
            }
            
        // Add days of the month
        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${window.calendarData.currentYear}-${String(window.calendarData.currentMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day text-center py-3 rounded-lg transition-colors cursor-pointer hover:bg-gray-100';
            
            // Check if there's a study plan for this date
            let topicLabel = '';
            if (window.calendarData.studyPlans && window.calendarData.studyPlans[dateStr]) {
                const plan = window.calendarData.studyPlans[dateStr];
                dayDiv.style.background = 'linear-gradient(45deg, #ffc107, #fd7e14)';
                dayDiv.style.color = 'white';
                dayDiv.style.fontWeight = 'bold';
                let displayPriority = plan.priority || '';
                let isMobile = false;
                if (typeof window !== 'undefined' && window.innerWidth <= 480) {
                    isMobile = true;
                }
                if (isMobile) {
                    // Ambil huruf awal setiap kata, maksimal 4 kata
                    let initials = displayPriority.split(/\s+/).slice(0,4).map(k => k[0] ? k[0].toUpperCase() : '').join('');
                    displayPriority = initials;
                } else {
                    if (displayPriority.length > 35) {
                        displayPriority = displayPriority.substring(0, 35) + '…';
                    }
                }
                if (plan.priority && plan.priority.trim() !== '' && plan.priority !== 'undefined') {
                    topicLabel = `<div class='text-xs mb-1 font-semibold' style='color:#fff;text-shadow:0 1px 2px #fd7e14;' title='${plan.priority}'>${displayPriority}</div>`;
                }
            }
            
            // Add click event listener with error handling
            dayDiv.addEventListener('click', (e) => {
                e.preventDefault();
                showCalendarPlanDetailModal(dateStr);
            });
            
            // Highlight today
            if (window.calendarData.currentYear === today.getFullYear() && 
                window.calendarData.currentMonth === today.getMonth() && 
                day === today.getDate()) {
                dayDiv.classList.add('bg-blue-200', 'font-bold');
            }
            
            dayDiv.innerHTML = `${topicLabel}<div>${day}</div>`;
            calendarGrid.appendChild(dayDiv);
        }
        
        // Update nearest plans list
        renderNearestPlans();
        
        console.log('Calendar generated successfully');
        
    } catch (error) {
        console.error('Error generating calendar:', error);
        showCalendarNotification('Gagal memuat kalender', 'error');
    }
}

// Enhanced month navigation
        function changeMonth(direction) {
    try {
        window.calendarData.currentMonth += direction;
        if (window.calendarData.currentMonth > 11) {
            window.calendarData.currentMonth = 0;
            window.calendarData.currentYear++;
        } else if (window.calendarData.currentMonth < 0) {
            window.calendarData.currentMonth = 11;
            window.calendarData.currentYear--;
            }
            generateCalendar();
    } catch (error) {
        console.error('Error changing month:', error);
        showCalendarNotification('Gagal mengganti bulan', 'error');
    }
}

// Enhanced dropdown update functions
function updatePlannerSubjectOptions() {
    try {
        const select = document.getElementById('planSubject');
        if (!select) {
            console.warn('planSubject element not found');
            return false;
        }
        
        select.innerHTML = '';
        
        // Add default option
        const defaultOpt = document.createElement('option');
        defaultOpt.value = '';
        defaultOpt.textContent = 'Pilih Mata Pelajaran';
        defaultOpt.disabled = true;
        defaultOpt.selected = true;
        select.appendChild(defaultOpt);
        
        // Check main studyData from timer system
        const mainStudyData = window.studyData || { subjects: [] };
        
        if (!mainStudyData.subjects || mainStudyData.subjects.length === 0) {
            const opt = document.createElement('option');
            opt.value = '';
            opt.disabled = true;
            opt.textContent = 'Belum ada topik, silakan tambah topik baru';
            select.appendChild(opt);
            console.log('No subjects found in studyData');
            return false;
        }
        
        // Use subjects from main studyData
        mainStudyData.subjects.forEach(subject => {
            if (subject && subject.name) {
                const opt = document.createElement('option');
                opt.value = subject.name;
                // Batasi panjang tampilan nama topik (35 karakter)
                let displayName = subject.name;
                if (displayName.length > 35) {
                    displayName = displayName.substring(0, 35) + '…';
                }
                opt.textContent = displayName;
                opt.title = subject.name; // Tooltip nama lengkap
                select.appendChild(opt);
            }
        });
        
        console.log(`Updated subject options: ${mainStudyData.subjects.length} subjects`);
        return true;
        
    } catch (error) {
        console.error('Error updating subject options:', error);
        return false;
    }
}

function updatePlannerTimeOptions() {
    try {
        const select = document.getElementById('planTime');
        if (!select) {
            console.warn('planTime element not found');
            return false;
        }
        
        select.innerHTML = '';
        
        // Add default option
        const defaultOpt = document.createElement('option');
        defaultOpt.value = '';
        defaultOpt.textContent = 'Pilih Durasi Belajar';
        defaultOpt.disabled = true;
        defaultOpt.selected = true;
        select.appendChild(defaultOpt);
        
        const options = [
            { value: '1–2 jam', label: '1–2 jam' },
            { value: '2–3 jam', label: '2–3 jam' },
            { value: '3–4 jam', label: '3–4 jam' },
            { value: '4–5 jam', label: '4–5 jam' },
            { value: '5+ jam', label: '5+ jam' }
        ];
        
        options.forEach(opt => {
            const o = document.createElement('option');
            o.value = opt.value;
            o.textContent = opt.label;
            select.appendChild(o);
        });
        
        console.log('Updated time options successfully');
        return true;
        
    } catch (error) {
        console.error('Error updating time options:', error);
        return false;
    }
}

// Enhanced form validation
function validateFormData(formData) {
    const errors = [];
    
    const date = formData.get('planDate');
    const studyTime = formData.get('planTime');
    const learningStyle = formData.get('planStyle');
    const priority = formData.get('planSubject');
    const description = formData.get('planDesc');
    
    if (!date || date.trim() === '') {
        errors.push('Tanggal harus diisi');
    }
    
    if (!studyTime || studyTime.trim() === '') {
        errors.push('Durasi belajar harus dipilih');
    }
    
    if (!learningStyle || learningStyle.trim() === '') {
        errors.push('Gaya belajar harus dipilih');
    }
    
    if (!priority || priority.trim() === '') {
        errors.push('Mata pelajaran harus dipilih');
    }
    
    if (!description || description.trim() === '') {
        errors.push('Deskripsi harus diisi');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors,
        data: { date, studyTime, learningStyle, priority, description }
    };
}

// Enhanced form submission handler
function setupFormEventListener() {
    try {
        const form = document.getElementById('aiStudyPlanForm');
        if (!form) {
            console.warn('Form aiStudyPlanForm not found - retrying...');
            setTimeout(setupFormEventListener, 1000);
            return false;
        }
        // Remove any existing event listeners
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        // Add new event listener
        newForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Form submitted - processing...');
            try {
                const formData = new FormData(newForm);
                const validation = validateFormData(formData);
                if (!validation.isValid) {
                    showCalendarNotification(validation.errors.join(', '), 'error');
                    return;
                }
                const { date, studyTime, learningStyle, priority, description } = validation.data;
                // Simpan ke calendarData.studyPlans
                window.calendarData.studyPlans[date] = {
                    studyTime,
                    learningStyle,
                    priority,
                    description: description.trim()
                };
                // Simpan ke localStorage
                if (saveCalendarStudyPlans()) {
                    showCalendarNotification('Rencana belajar berhasil disimpan!');
                    newForm.reset();
                    generateCalendar();
                } else {
                    showCalendarNotification('Gagal menyimpan rencana', 'error');
                }
            } catch (error) {
                console.error('Error processing form submission:', error);
                showCalendarNotification('Terjadi kesalahan saat menyimpan!', 'error');
            }
        });
        console.log('Form event listener set up successfully');
        return true;
    } catch (error) {
        console.error('Error setting up form event listener:', error);
        return false;
    }
}

// Enhanced initialization function
function initializeStudyPlanner() {
    try {
        console.log('Initializing study planner...');
        
        // Prevent multiple initializations
        if (window.calendarData.initialized) {
            console.log('Study planner already initialized');
            return;
        }
        
        // Load calendar data
        loadCalendarStudyPlans();
        
        // Update dropdown options with retry logic
        const updateOptions = () => {
            const subjectSuccess = updatePlannerSubjectOptions();
            const timeSuccess = updatePlannerTimeOptions();
            
            if (!subjectSuccess || !timeSuccess) {
                console.log('Retrying option updates...');
                setTimeout(updateOptions, 1000);
                return;
            }
            
            console.log('Dropdown options updated successfully');
        };
        
        updateOptions();
        
        // Set up form event listener
        setupFormEventListener();
        
        // Generate initial calendar
        generateCalendar();
        
        // Mark as initialized
        window.calendarData.initialized = true;
        
        console.log('Study planner initialized successfully');
        
            } catch (error) {
        console.error('Error initializing study planner:', error);
        showCalendarNotification('Gagal menginisialisasi planner', 'error');
    }
}

// Enhanced modal functions
function showCalendarPlanDetailModal(dateStr) {
    try {
        let modal = document.getElementById('calendarPlanDetailModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'calendarPlanDetailModal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s ease, visibility 0.3s ease;
            `;
            document.body.appendChild(modal);
        }
        
        const plan = window.calendarData.studyPlans[dateStr];
        const today = new Date();
        const selectedDate = new Date(dateStr);
        const isToday = selectedDate.toDateString() === today.toDateString();
        
        if (plan) {
            // Modal for date with existing plan
            modal.innerHTML = `
                <div class="modal-content" style="background:linear-gradient(135deg,#f3e7fa 60%,#e3eeff 100%);border-radius:20px;padding:28px 18px;max-width:420px;width:95%;box-shadow:0 8px 32px rgba(102,126,234,0.18);max-height:80vh;overflow-y:auto;">
                    <h3 class="text-xl font-bold mb-2">Study Plan<br><span class="text-purple-600 text-base">${formatDate(dateStr)}</span></h3>
                    <div class="glass-card p-4 rounded-xl mb-3" style="background:linear-gradient(135deg,#a18cd1 60%,#fbc2eb 100%);border-radius:18px;">
                        <div class="mb-1"><span class="font-semibold">⏳ Waktu Belajar:</span> ${plan.studyTime}</div>
                        <div class="mb-1"><span class="font-semibold">🧠 Gaya Belajar:</span> ${plan.learningStyle ? plan.learningStyle.charAt(0).toUpperCase() + plan.learningStyle.slice(1) : 'N/A'}</div>
                        <div class="mb-1"><span class="font-semibold">🎯 Prioritas:</span> ${plan.priority}</div>
                        <div class="mb-1"><span class="font-semibold">✍️ Deskripsi:</span> ${plan.description}</div>
                        <div class="flex gap-2 mt-2">
                            <button class="btn-primary" style="padding:4px 12px;font-size:13px;" onclick="editCalendarStudyPlan('${dateStr}')">🛠️ Edit</button>
                            <button class="delete-btn" style="padding:4px 12px;font-size:13px;" onclick="deleteCalendarStudyPlan('${dateStr}')">🗑️ Hapus</button>
                    </div>
                    </div>
                    <button class="btn-primary w-full mt-4" style="display:flex;justify-content:center;align-items:center;text-align:center;" onclick="closeCalendarModal()">Tutup</button>
                    </div>
            `;
        } else {
            // Modal for empty date
            const dayLabel = isToday ? 'Hari Ini' : formatDate(dateStr);
            const emptyMessage = isToday ? 
                'Belum ada rencana belajar untuk hari ini. Yuk buat rencana belajar!' : 
                'Belum ada rencana belajar untuk tanggal ini.';
            
            modal.innerHTML = `
                <div class="modal-content" style="background:linear-gradient(135deg,#f8f9fa 60%,#e9ecef 100%);border-radius:20px;padding:28px 18px;max-width:420px;width:95%;box-shadow:0 8px 32px rgba(102,126,234,0.18);max-height:80vh;overflow-y:auto;">
                    <h3 class="text-xl font-bold mb-2">Study Plan<br><span class="text-gray-600 text-base">${dayLabel}</span></h3>
                    <div class="glass-card p-4 rounded-xl mb-3" style="background:linear-gradient(135deg,#f1f3f4 60%,#e8eaed 100%);border-radius:18px;text-align:center;">
                        <div class="text-6xl mb-3">📅</div>
                        <div class="text-gray-600 font-semibold mb-2">${emptyMessage}</div>
                        ${isToday ? '<div class="text-sm text-gray-500">Klik tombol "Buat Rencana" untuk mulai merencanakan hari ini!</div>' : ''}
                    </div>
                    <div class="flex gap-2 mt-4">
                      <button class="btn-primary flex-1" onclick="createNewCalendarPlan('${dateStr}')">📝 Buat Rencana</button>
                      <button class="btn-primary flex-1" onclick="closeCalendarModal()">Tutup</button>
                    </div>
                    </div>
                `;
        }
        
        // Close modal when clicking outside
        modal.onclick = function(e) {
            if (e.target === modal) closeCalendarModal();
        };
        
        // Show modal
        modal.style.opacity = '1';
        modal.style.visibility = 'visible';
        
    } catch (error) {
        console.error('Error showing modal:', error);
        showCalendarNotification('Gagal menampilkan detail', 'error');
    }
}

function closeCalendarModal() {
    try {
        const modal = document.getElementById('calendarPlanDetailModal');
        if (modal) {
            modal.style.opacity = '0';
            modal.style.visibility = 'hidden';
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300);
        }
    } catch (error) {
        console.error('Error closing modal:', error);
    }
}

function editCalendarStudyPlan(dateStr) {
    try {
        const plan = window.calendarData.studyPlans[dateStr];
        if (!plan) {
            showCalendarNotification('Rencana tidak ditemukan', 'error');
            return;
        }
        
        const form = document.getElementById('aiStudyPlanForm');
        if (!form) {
            showCalendarNotification('Form tidak ditemukan', 'error');
            return;
        }
        
        // Fill form with existing data
        const elements = form.elements;
        if (elements.planDate) elements.planDate.value = dateStr;
        if (elements.planTime) elements.planTime.value = plan.studyTime || '';
        if (elements.planStyle) elements.planStyle.value = plan.learningStyle || '';
        if (elements.planSubject) elements.planSubject.value = plan.priority || '';
        if (elements.planDesc) elements.planDesc.value = plan.description || '';
        
        // Remove old plan
        delete window.calendarData.studyPlans[dateStr];
        saveCalendarStudyPlans();
        
        closeCalendarModal();
        showCalendarNotification('Silakan edit rencana dan simpan untuk update.');
        
        // Scroll to form
        form.scrollIntoView({ behavior: 'smooth' });
        
        generateCalendar();
        
    } catch (error) {
        console.error('Error editing plan:', error);
        showCalendarNotification('Gagal mengedit rencana', 'error');
    }
}

function deleteCalendarStudyPlan(dateStr) {
    try {
        if (!window.calendarData.studyPlans[dateStr]) {
            showCalendarNotification('Rencana tidak ditemukan', 'error');
            return;
        }
        // Ganti confirm dengan SweetAlert
            Swal.fire({
            title: 'Hapus rencana belajar ini?',
            text: 'Data yang dihapus tidak dapat dikembalikan!',
                            icon: 'warning',
                            showCancelButton: true,
            confirmButtonText: 'Ya, hapus!',
                            cancelButtonText: 'Batal'
                        }).then((result) => {
                            if (result.isConfirmed) {
                delete window.calendarData.studyPlans[dateStr];
                saveCalendarStudyPlans();
                closeCalendarModal();
                showCalendarNotification('Rencana berhasil dihapus!');
                generateCalendar();
            }
        });
    } catch (error) {
        console.error('Error deleting plan:', error);
        showCalendarNotification('Gagal menghapus rencana', 'error');
    }
}

function createNewCalendarPlan(dateStr) {
    try {
        const form = document.getElementById('aiStudyPlanForm');
        if (!form) {
            showCalendarNotification('Form tidak ditemukan', 'error');
            return;
        }
        
        // Set date in form
        const dateInput = form.elements.planDate;
        if (dateInput) {
            dateInput.value = dateStr;
        }
        
        // Close modal
        closeCalendarModal();
        
        // Scroll to form
        form.scrollIntoView({ behavior: 'smooth' });
        
        // Focus on first field after date
        setTimeout(() => {
            const timeField = document.getElementById('planTime');
            if (timeField) {
                timeField.focus();
            }
        }, 500);
        
        showCalendarNotification('Silakan lengkapi form untuk membuat rencana belajar!');
        
    } catch (error) {
        console.error('Error creating new plan:', error);
        showCalendarNotification('Gagal membuat rencana baru', 'error');
    }
}

// Enhanced nearest plans rendering
function renderNearestPlans() {
    try {
        const listDiv = document.getElementById('nearestPlansList');
        if (!listDiv) return;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Get all plans, filter upcoming ones, sort by nearest date
        const plansArr = Object.entries(window.calendarData.studyPlans)
            .map(([date, plan]) => ({ date, ...plan }))
            .filter(plan => new Date(plan.date) >= today)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        listDiv.innerHTML = '';
        
        if (plansArr.length === 0) {
            listDiv.innerHTML = '<div class="text-gray-500 text-center py-4">Belum ada rencana belajar mendatang.</div>';
            return;
        }
        
        plansArr.slice(0, 5).forEach(plan => {
            const div = document.createElement('div');
            div.className = 'p-4 rounded-xl glass-card hover:shadow-lg transition-shadow cursor-pointer';
            div.onclick = () => showCalendarPlanDetailModal(plan.date);
            
            const learningStyleDisplay = plan.learningStyle ? 
                plan.learningStyle.charAt(0).toUpperCase() + plan.learningStyle.slice(1) : 
                'N/A';
            // Batasi panjang nama topik (plan.priority)
            let displayPriority = plan.priority || '';
            if (displayPriority.length > 35) {
                displayPriority = displayPriority.substring(0, 35) + '…';
            }
            
            div.innerHTML = `
                <div class="flex items-center gap-3 mb-2">
                    <span class="text-purple-600 font-bold">${formatDate(plan.date)}</span>
                    <span class="text-xs bg-yellow-200 text-yellow-800 rounded px-2 py-1">${plan.studyTime}</span>
                </div>
                <div class="flex items-center gap-2 mb-2">
                    <span class="text-xs bg-blue-100 text-blue-800 rounded px-2 py-1">${learningStyleDisplay}</span>
                </div>
                <div class="font-semibold text-gray-800 mb-1" title="${plan.priority || ''}">🎯 ${displayPriority}</div>
                <div class="text-gray-700 text-sm">${plan.description}</div>
            `;
            
            listDiv.appendChild(div);
        });
        
    } catch (error) {
        console.error('Error rendering nearest plans:', error);
    }
}

// Enhanced update function
function updateStudyPlanner() {
    try {
        console.log('Updating study planner...');
        updatePlannerSubjectOptions();
        updatePlannerTimeOptions();
        generateCalendar();
    } catch (error) {
        console.error('Error updating study planner:', error);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeStudyPlanner();
});

// Make functions globally available
window.changeMonth = changeMonth;
window.editStudyPlan = editStudyPlan;
window.deleteStudyPlan = deleteStudyPlan;
window.showPlanDetailModal = showPlanDetailModal;
window.closeModal = closeModal;
window.createNewPlan = createNewPlan;
window.updateStudyPlanner = updateStudyPlanner;
window.loadStudyPlans = loadStudyPlans;
window.saveStudyPlans = saveStudyPlans;

// Fungsi untuk toggle centang subject
        function toggleSelectSubject(index) {
            if (!window.selectedSubjectIndexes) window.selectedSubjectIndexes = [];
            const idx = window.selectedSubjectIndexes.indexOf(index);
            if (idx === -1) {
                window.selectedSubjectIndexes.push(index);
            } else {
                window.selectedSubjectIndexes.splice(idx, 1);
            }
    updateTodaySchedule();
        }
window.toggleSelectSubject = toggleSelectSubject;

// Fungsi untuk hapus semua subject yang dicentang
        function deleteSelectedSubjects() {
    if (!window.selectedSubjectIndexes || window.selectedSubjectIndexes.length === 0) return;
            Swal.fire({
        title: `Hapus ${window.selectedSubjectIndexes.length} topik terpilih?`,
        text: 'Data yang dihapus tidak dapat dikembalikan!',
                icon: 'warning',
                showCancelButton: true,
        confirmButtonText: 'Ya, hapus!',
                cancelButtonText: 'Batal'
            }).then((result) => {
                if (result.isConfirmed) {
            // Hapus dari studyData.subjects berdasarkan index
            // Urutkan index dari besar ke kecil agar splice tidak menggeser
            window.selectedSubjectIndexes.sort((a, b) => b - a).forEach(idx => {
                        studyData.subjects.splice(idx, 1);
                    });
                    window.selectedSubjectIndexes = [];
                    saveUserData();
                    updateDashboard();
            showNotification('Topik terpilih berhasil dihapus!');
                }
            });
        }
window.deleteSelectedSubjects = deleteSelectedSubjects;

// Fungsi untuk reset progress semua subject yang dicentang
        function resetSelectedSubjects() {
    if (!window.selectedSubjectIndexes || window.selectedSubjectIndexes.length === 0) return;
            Swal.fire({
        title: `Reset progress ${window.selectedSubjectIndexes.length} topik?`,
        text: 'Progress akan direset ke 0%.',
                icon: 'question',
                showCancelButton: true,
        confirmButtonText: 'Ya, reset!',
                cancelButtonText: 'Batal'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.selectedSubjectIndexes.forEach(idx => {
                const subject = studyData.subjects[idx];
                if (subject) {
                    subject.totalTime = 0;
                    subject.runningTimerElapsed = 0;
                    subject.progress = 0;
                    subject.completed = false;
                    subject.lastMilestone = 0;
                    subject._milestoneNotified = {};
                        }
                    });
                    saveUserData();
                    updateDashboard();
            showNotification('Progress topik terpilih berhasil direset!');
                }
            });
        }
window.resetSelectedSubjects = resetSelectedSubjects;

// --- Redefinisi continueStudy agar langsung start timer setelah pilih subject ---
function continueStudy(subjectName) {
    // Cari index subject berdasarkan nama
    const index = studyData.subjects.findIndex(s => s.name === subjectName);
    if (index !== -1) {
        window.lastContinuedSubjectName = subjectName;
        window.lastContinuedSubjectIndex = index;
        updateActiveSubjectName();
        showNotification(`Fokus belajar pada: ${subjectName}`);
        // Otomatis mulai timer jika belum berjalan
        if (!robustTimer.isRunning) {
            startTimer();
        }
    } else {
        showNotification('Topik tidak ditemukan!', 'error');
    }
}
window.continueStudy = continueStudy;

// --- Pastikan resetSubjectFromSchedule juga global jika dipakai di HTML ---
if (typeof resetSubjectFromSchedule === 'function') {
    window.resetSubjectFromSchedule = resetSubjectFromSchedule;
}

// --- Perbaiki initializeEventListeners agar tidak error jika elemen tidak ada ---
if (typeof EnhancedInternTrack === 'function') {
    EnhancedInternTrack.prototype.initializeEventListeners = function() {
        const logForm = document.getElementById('logForm');
        if (logForm) logForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addLog();
        });
        const editForm = document.getElementById('editForm');
        if (editForm) editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEdit();
        });
        const typeSelect = document.getElementById('type');
        const projectField = document.getElementById('projectField');
        if (typeSelect && projectField) {
            typeSelect.addEventListener('change', (e) => {
                if (e.target.value === 'project') {
                    projectField.classList.remove('hidden');
                    document.getElementById('project').required = true;
                } else {
                    projectField.classList.add('hidden');
                    document.getElementById('project').required = false;
                    document.getElementById('project').value = '';
                }
            });
        }
        const filterTabs = document.querySelectorAll('.filter-tab');
        filterTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const filter = e.target.getAttribute('data-filter');
                this.setFilter(filter);
            });
        });
        const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
        if (bulkDeleteBtn) {
            bulkDeleteBtn.addEventListener('click', () => {
                this.bulkDelete();
            });
        }
        const logList = document.getElementById('logList');
        if (logList) {
            logList.addEventListener('change', (e) => {
                if (e.target.classList.contains('log-checkbox')) {
                    this.updateBulkDeleteBtn();
                }
            });
        }
        const dateInput = document.getElementById('date');
        if (dateInput) dateInput.valueAsDate = new Date();
    };
}

function showProfile() {
    const savedUser = localStorage.getItem('eduMentorUser') || 'Pengguna';
    const savedData = localStorage.getItem(`eduMentorData_${savedUser}`);
    let studyData = { subjects: [], studyTime: 0, streak: 0, goals: [] };
    if (savedData) {
        studyData = JSON.parse(savedData);
    }

    const logs = JSON.parse(localStorage.getItem('interntrack_logs')) || [];

    const totalTopics = studyData.subjects.length;
    const completedCourses = studyData.subjects.filter(s => s.completed).length;
    const totalActivities = logs.length;
    const completedActivities = logs.filter(log => log.status === 'completed').length;

    Swal.fire({
        html: `
            <div class="flex flex-col items-center">
                <div class="bg-gradient-to-br from-purple-600 to-indigo-500 w-[90px] h-[90px] rounded-full flex items-center justify-center mb-2">
                    <svg width="48" height="48" fill="white" viewBox="0 0 24 24">
                        <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z"/>
                    </svg>
                </div>
                <div class="text-xl font-bold mb-4">${savedUser}</div>
                <div class="grid grid-cols-2 gap-4 w-full max-w-sm mb-6">
                    <div class="bg-green-50 rounded-2xl p-4 text-center">
                        <div class="text-indigo-500 text-2xl mb-1">📚</div>
                        <div class="text-lg font-semibold text-indigo-600">${totalTopics}</div>
                        <div class="text-sm text-gray-600 mt-1">Topik Belajar</div>
                    </div>
                    <div class="bg-indigo-50 rounded-2xl p-4 text-center">
                        <div class="text-emerald-500 text-2xl mb-1">🏆</div>
                        <div class="text-lg font-semibold text-emerald-600">${completedCourses}</div>
                        <div class="text-sm text-gray-600 mt-1">Kursus Selesai</div>
                    </div>
                    <div class="bg-indigo-50 rounded-2xl p-4 text-center">
                        <div class="text-red-500 text-2xl mb-1">📋</div>
                        <div class="text-lg font-semibold text-red-500">${totalActivities}</div>
                        <div class="text-sm text-gray-600 mt-1">Total Kegiatan</div>
                    </div>
                    <div class="bg-green-50 rounded-2xl p-4 text-center">
                        <div class="text-green-500 text-2xl mb-1">✅</div>
                        <div class="text-lg font-semibold text-green-500">${completedActivities}</div>
                        <div class="text-sm text-gray-600 mt-1">Kegiatan Selesai</div>
                    </div>
                </div>
                <button id="logoutBtn" class="bg-gradient-to-r from-purple-600 to-indigo-500 text-white py-3 px-6 rounded-xl font-semibold text-sm w-full max-w-sm">Logout / Hapus Data</button>
            </div>
        `,
        showConfirmButton: true,
        confirmButtonText: 'Tutup',
        customClass: { popup: 'rounded-2xl' },
        didOpen: () => {
            document.getElementById('logoutBtn').onclick = function() {
                localStorage.removeItem('eduMentorUser');
                location.reload();
            };
        }
    });
}

window.showProfile = showProfile;
