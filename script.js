// State Management & LocalStorage Initialization
let rooms = JSON.parse(localStorage.getItem('hotel_rooms')) || [
    { id: 1, number: '101', type: 'Single', price: 120, status: 'Available', amenities: ['WiFi', 'AC'] },
    { id: 2, number: '102', type: 'Double', price: 180, status: 'Occupied', amenities: ['WiFi', 'AC', 'TV'] },
    { id: 3, number: '201', type: 'Suite',  price: 350, status: 'Available', amenities: ['WiFi', 'AC', 'Mini Bar', 'Ocean View'] },
    { id: 4, number: '202', type: 'Deluxe', price: 260, status: 'Maintenance', amenities: ['WiFi', 'Jacuzzi'] }
];

let reservations = JSON.parse(localStorage.getItem('hotel_reservations')) || [
    { id: 101, guestName: 'Alice Johnson', roomNumber: '102', checkIn: '2026-10-12', checkOut: '2026-10-16', status: 'Checked In' }
];

let billing = JSON.parse(localStorage.getItem('hotel_billing')) || [
    { id: 'INV-9001', guestName: 'Alice Johnson', roomNumber: '102', amount: 720, status: 'Paid' }
];

let staff = JSON.parse(localStorage.getItem('hotel_staff')) || [
    { id: 1, name: 'Robert Fox', role: 'Front Desk', phone: '+1 555-0192', shift: 'Morning' },
    { id: 2, name: 'Jane Cooper', role: 'Housekeeping', phone: '+1 555-0143', shift: 'Evening' }
];

let occupancyChartInstance = null;
let revenueChartInstance = null;

// Save state to LocalStorage
function saveData() {
    localStorage.setItem('hotel_rooms', JSON.stringify(rooms));
    localStorage.setItem('hotel_reservations', JSON.stringify(reservations));
    localStorage.setItem('hotel_billing', JSON.stringify(billing));
    localStorage.setItem('hotel_staff', JSON.stringify(staff));
}

// Toast Notification
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-emerald-600' : 'bg-rose-600';
    toast.className = `${bgColor} text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-3 pointer-events-auto transition-all transform translate-y-2 opacity-0`;
    toast.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}"></i> ${message}`;
    
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    setTimeout(() => {
        toast.classList.add('translate-y-2', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Tab Switching
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-indigo-600', 'text-white', 'shadow-md', 'shadow-indigo-600/30');
        btn.classList.add('hover:bg-slate-800', 'hover:text-white');
    });

    document.getElementById(`tab-${tabId}`).classList.remove('hidden');
    const activeBtn = document.getElementById(`nav-${tabId}`);
    activeBtn.classList.add('bg-indigo-600', 'text-white', 'shadow-md', 'shadow-indigo-600/30');
    activeBtn.classList.remove('hover:bg-slate-800', 'hover:text-white');

    const titles = {
        dashboard: 'Dashboard Overview',
        rooms: 'Room Management',
        reservations: 'Reservation Management',
        billing: 'Billing & Invoices',
        staff: 'Staff Directory'
    };
    document.getElementById('page-title').innerText = titles[tabId];

    if (tabId === 'dashboard') updateDashboard();
    if (tabId === 'rooms') renderRooms();
    if (tabId === 'reservations') renderReservations();
    if (tabId === 'billing') renderBilling();
    if (tabId === 'staff') renderStaff();
}

function toggleMobileMenu() {
    const sidebar = document.querySelector('aside');
    sidebar.classList.toggle('hidden');
}

// Modal Controllers
function openModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

function openReservationModal() {
    const select = document.getElementById('form-res-room');
    select.innerHTML = '';
    const availableRooms = rooms.filter(r => r.status === 'Available');
    
    if (availableRooms.length === 0) {
        select.innerHTML = '<option value="">No available rooms found</option>';
    } else {
        availableRooms.forEach(room => {
            select.innerHTML += `<option value="${room.number}">Room ${room.number} (${room.type} - $${room.price}/night)</option>`;
        });
    }
    openModal('reservation-modal');
}

// ================= DASHBOARD & CHARTS =================
function updateDashboard() {
    const total = rooms.length;
    const available = rooms.filter(r => r.status === 'Available').length;
    const occupied = rooms.filter(r => r.status === 'Occupied').length;
    const totalRev = billing.reduce((acc, curr) => curr.status === 'Paid' ? acc + curr.amount : acc, 0);

    document.getElementById('stat-total-rooms').innerText = total;
    document.getElementById('stat-avail-rooms').innerText = available;
    document.getElementById('stat-occ-rooms').innerText = occupied;
    document.getElementById('stat-revenue').innerText = `$${totalRev.toLocaleString()}`;

    // Occupancy Chart
    const maintenance = rooms.filter(r => r.status === 'Maintenance').length;
    const ctxOcc = document.getElementById('occupancyChart').getContext('2d');
    if (occupancyChartInstance) occupancyChartInstance.destroy();

    occupancyChartInstance = new Chart(ctxOcc, {
        type: 'doughnut',
        data: {
            labels: ['Available', 'Occupied', 'Maintenance'],
            datasets: [{
                data: [available, occupied, maintenance],
                backgroundColor: ['#10b981', '#f59e0b', '#64748b'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }
    });

    // Revenue Chart by Category
    const categories = ['Single', 'Double', 'Suite', 'Deluxe'];
    const revData = categories.map(cat => {
        const catRooms = rooms.filter(r => r.type === cat).map(r => r.number);
        return billing.filter(b => catRooms.includes(b.roomNumber) && b.status === 'Paid')
                      .reduce((sum, b) => sum + b.amount, 0);
    });

    const ctxRev = document.getElementById('revenueChart').getContext('2d');
    if (revenueChartInstance) revenueChartInstance.destroy();

    revenueChartInstance = new Chart(ctxRev, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [{
                label: 'Revenue ($)',
                data: revData,
                backgroundColor: '#6366f1',
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
}

// ================= ROOM MANAGEMENT =================
function renderRooms(filteredRooms = rooms) {
    const grid = document.getElementById('rooms-grid');
    grid.innerHTML = '';

    if (filteredRooms.length === 0) {
        grid.innerHTML = `<p class="text-slate-400 text-sm col-span-full text-center py-8">No rooms found.</p>`;
        return;
    }

    filteredRooms.forEach(room => {
        const statusColors = {
            'Available': 'bg-emerald-50 text-emerald-600 border-emerald-100',
            'Occupied': 'bg-amber-50 text-amber-600 border-amber-100',
            'Maintenance': 'bg-slate-100 text-slate-600 border-slate-200'
        };

        grid.innerHTML += `
            <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
                <div class="flex items-start justify-between">
                    <div>
                        <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">${room.type} Room</span>
                        <h3 class="text-xl font-bold text-slate-800">Room ${room.number}</h3>
                    </div>
                    <span class="px-3 py-1 text-xs font-semibold rounded-full border ${statusColors[room.status]}">${room.status}</span>
                </div>
                <div class="flex flex-wrap gap-1">
                    ${room.amenities.map(a => `<span class="bg-slate-50 text-slate-600 text-xs px-2.5 py-1 rounded-lg border border-slate-100">${a}</span>`).join('')}
                </div>
                <div class="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span class="text-base font-bold text-indigo-600">$${room.price}<span class="text-xs text-slate-400 font-normal"> /night</span></span>
                    <button onclick="deleteRoom(${room.id})" class="text-slate-400 hover:text-rose-600 text-sm"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </div>
        `;
    });
}

function filterRooms() {
    const query = document.getElementById('room-search').value.toLowerCase();
    const status = document.getElementById('room-filter-status').value;

    const filtered = rooms.filter(r => {
        const matchesQuery = r.number.toLowerCase().includes(query);
        const matchesStatus = status === '' || r.status === status;
        return matchesQuery && matchesStatus;
    });
    renderRooms(filtered);
}

function handleRoomSubmit(e) {
    e.preventDefault();
    const number = document.getElementById('form-room-no').value;
    const type = document.getElementById('form-room-type').value;
    const price = Number(document.getElementById('form-room-price').value);
    const amenitiesStr = document.getElementById('form-room-amenities').value;
    const amenities = amenitiesStr ? amenitiesStr.split(',').map(s => s.trim()) : ['WiFi'];

    if (rooms.some(r => r.number === number)) {
        showToast('Room number already exists!', 'error');
        return;
    }

    rooms.push({ id: Date.now(), number, type, price, status: 'Available', amenities });
    saveData();
    closeModal('room-modal');
    document.getElementById('room-form').reset();
    renderRooms();
    showToast('Room created successfully!');
}

function deleteRoom(id) {
    rooms = rooms.filter(r => r.id !== id);
    saveData();
    renderRooms();
    showToast('Room deleted.');
}

// ================= RESERVATIONS =================
function renderReservations(filtered = reservations) {
    const tbody = document.getElementById('reservations-table-body');
    tbody.innerHTML = '';

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-6 text-center text-slate-400">No reservations found.</td></tr>`;
        return;
    }

    filtered.forEach(res => {
        tbody.innerHTML += `
            <tr class="hover:bg-slate-50/50 transition-colors">
                <td class="px-6 py-4 font-semibold text-slate-800">${res.guestName}</td>
                <td class="px-6 py-4">Room ${res.roomNumber}</td>
                <td class="px-6 py-4">${res.checkIn}</td>
                <td class="px-6 py-4">${res.checkOut}</td>
                <td class="px-6 py-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-600">${res.status}</span></td>
                <td class="px-6 py-4 text-right space-x-2">
                    <button onclick="checkoutReservation(${res.id})" class="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-1.5 rounded-xl text-xs font-medium">Check-out</button>
                    <button onclick="cancelReservation(${res.id})" class="text-slate-400 hover:text-rose-600 text-xs"><i class="fa-solid fa-xmark"></i></button>
                </td>
            </tr>
        `;
    });
}

function filterReservations() {
    const query = document.getElementById('res-search').value.toLowerCase();
    const filtered = reservations.filter(r => r.guestName.toLowerCase().includes(query));
    renderReservations(filtered);
}

function handleReservationSubmit(e) {
    e.preventDefault();
    const guestName = document.getElementById('form-res-name').value;
    const roomNumber = document.getElementById('form-res-room').value;
    const checkIn = document.getElementById('form-res-checkin').value;
    const checkOut = document.getElementById('form-res-checkout').value;

    if (!roomNumber) {
        showToast('Please select a valid room.', 'error');
        return;
    }

    const room = rooms.find(r => r.number === roomNumber);
    if (room) room.status = 'Occupied';

    reservations.push({ id: Date.now(), guestName, roomNumber, checkIn, checkOut, status: 'Checked In' });
    saveData();
    closeModal('reservation-modal');
    document.getElementById('reservation-form').reset();
    renderReservations();
    showToast('Reservation booked successfully!');
}

function checkoutReservation(id) {
    const res = reservations.find(r => r.id === id);
    if (!res) return;

    res.status = 'Checked Out';

    const room = rooms.find(r => r.number === res.roomNumber);
    if (room) room.status = 'Available';

    const start = new Date(res.checkIn);
    const end = new Date(res.checkOut);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    const roomPrice = room ? room.price : 150;
    const totalAmount = diffDays * roomPrice;

    billing.push({
        id: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
        guestName: res.guestName,
        roomNumber: res.roomNumber,
        amount: totalAmount,
        status: 'Paid'
    });

    saveData();
    renderReservations();
    showToast('Guest checked out & invoice generated!');
}

function cancelReservation(id) {
    const res = reservations.find(r => r.id === id);
    if (res) {
        const room = rooms.find(r => r.number === res.roomNumber);
        if (room) room.status = 'Available';
    }
    reservations = reservations.filter(r => r.id !== id);
    saveData();
    renderReservations();
    showToast('Reservation cancelled.');
}

// ================= BILLING & INVOICES =================
function renderBilling() {
    const tbody = document.getElementById('billing-table-body');
    tbody.innerHTML = '';

    if (billing.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-6 text-center text-slate-400">No invoices generated yet.</td></tr>`;
        return;
    }

    billing.forEach(inv => {
        tbody.innerHTML += `
            <tr class="hover:bg-slate-50/50 transition-colors">
                <td class="px-6 py-4 font-semibold text-slate-800">${inv.id}</td>
                <td class="px-6 py-4">${inv.guestName}</td>
                <td class="px-6 py-4">Room ${inv.roomNumber}</td>
                <td class="px-6 py-4 font-bold text-indigo-600">$${inv.amount}</td>
                <td class="px-6 py-4"><span class="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-600">${inv.status}</span></td>
                <td class="px-6 py-4 text-right">
                    <button onclick="viewInvoice('${inv.id}')" class="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-medium"><i class="fa-solid fa-eye mr-1"></i> View</button>
                </td>
            </tr>
        `;
    });
}

function viewInvoice(invId) {
    const inv = billing.find(b => b.id === invId);
    if (!inv) return;

    const content = document.getElementById('invoice-content');
    content.innerHTML = `
        <div class="space-y-2">
            <p><strong>Invoice ID:</strong> ${inv.id}</p>
            <p><strong>Guest Name:</strong> ${inv.guestName}</p>
            <p><strong>Room Number:</strong> ${inv.roomNumber}</p>
            <p><strong>Payment Status:</strong> <span class="text-emerald-600 font-semibold">${inv.status}</span></p>
            <div class="border-t border-slate-100 pt-3 mt-3 flex justify-between items-center text-base font-bold text-slate-800">
                <span>Grand Total:</span>
                <span class="text-indigo-600">$${inv.amount}</span>
            </div>
        </div>
    `;
    openModal('invoice-modal');
}

// ================= STAFF MANAGEMENT =================
function renderStaff() {
    const grid = document.getElementById('staff-grid');
    grid.innerHTML = '';

    if (staff.length === 0) {
        grid.innerHTML = `<p class="text-slate-400 text-sm col-span-full text-center py-8">No staff members added.</p>`;
        return;
    }

    staff.forEach(s => {
        grid.innerHTML += `
            <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div class="space-y-1">
                    <h3 class="font-bold text-slate-800">${s.name}</h3>
                    <p class="text-xs text-indigo-600 font-medium">${s.role}</p>
                    <p class="text-xs text-slate-400"><i class="fa-solid fa-phone mr-1"></i> ${s.phone}</p>
                    <span class="inline-block mt-2 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-600">${s.shift} Shift</span>
                </div>
                <button onclick="deleteStaff(${s.id})" class="text-slate-400 hover:text-rose-600 text-sm"><i class="fa-solid fa-trash-can"></i></button>
            </div>
        `;
    });
}

function handleStaffSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('form-staff-name').value;
    const role = document.getElementById('form-staff-role').value;
    const phone = document.getElementById('form-staff-phone').value;
    const shift = document.getElementById('form-staff-shift').value;

    staff.push({ id: Date.now(), name, role, phone, shift });
    saveData();
    closeModal('staff-modal');
    document.getElementById('staff-form').reset();
    renderStaff();
    showToast('Staff member added successfully!');
}

function deleteStaff(id) {
    staff = staff.filter(s => s.id !== id);
    saveData();
    renderStaff();
    showToast('Staff member removed.');
}

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    updateDashboard();
});