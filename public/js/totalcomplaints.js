const allSideMenu = document.querySelectorAll('#sidebar .side-menu.top li a');

allSideMenu.forEach(item => {
    const li = item.parentElement;
    item.addEventListener('click', function () {
        allSideMenu.forEach(i => {
            i.parentElement.classList.remove('active');
        });
        li.classList.add('active');
    });
});

// TOGGLE SIDEBAR
const menuBar = document.querySelector('#content nav .bx.bx-menu');
const sidebar = document.getElementById('sidebar');
menuBar.addEventListener('click', function () {
    sidebar.classList.toggle('hide');
});

const searchButton = document.querySelector('#content nav form .form-input button');
const searchButtonIcon = document.querySelector('#content nav form .form-input button .bx');
const searchForm = document.querySelector('#content nav form');

searchButton.addEventListener('click', function (e) {
    if (window.innerWidth < 576) {
        e.preventDefault();
        searchForm.classList.toggle('show');
        if (searchForm.classList.contains('show')) {
            searchButtonIcon.classList.replace('bx-search', 'bx-x');
        } else {
            searchButtonIcon.classList.replace('bx-x', 'bx-search');
        }
    }
});

if (window.innerWidth < 768) {
    sidebar.classList.add('hide');
} else if (window.innerWidth > 576) {
    searchButtonIcon.classList.replace('bx-x', 'bx-search');
    searchForm.classList.remove('show');
}

window.addEventListener('resize', function () {
    if (this.innerWidth > 576) {
        searchButtonIcon.classList.replace('bx-x', 'bx-search');
        searchForm.classList.remove('show');
    }
});

const switchMode = document.getElementById('switch-mode');
switchMode.addEventListener('change', function () {
    if (this.checked) {
        document.body.classList.add('dark');
    } else {
        document.body.classList.remove('dark');
    }
});

function togglePopup() {
    const popup = document.getElementById('profilePopup');
    popup.classList.toggle('show');
}

function openModal(_id) {
    fetch(`/totalcomplaints/${_id}`)
        .then(response => response.json())
        .then(data => {
            document.getElementById('complaintData').innerHTML = `
                <p><strong>Complaint Code:</strong> ${data.complaintCode}</p>
                <p><strong>Employee Name:</strong> ${data.employeeName}</p>
                <p><strong>Employee Code:</strong> ${data.employeeCode}</p>
                <p><strong>Title:</strong> ${data.complaintTitle}</p>
                <p><strong>Department:</strong> ${data.department}</p>
                <p><strong>Email:</strong> ${data.email}</p>
                <p><strong>Date:</strong> ${new Date(data.complaintDate).toLocaleDateString()}</p>
                <p><strong>Status:</strong> ${data.status}</p>
                <p><strong>Description:</strong> ${data.complaintDetails}</p>
            `;
			// Add document link or preview
			const documentContainer = document.getElementById('documentContainer');
			if (data.complaintAttachment) {
                // Assuming complaintAttachment is a path relative to the 'uploads' directory
                const fileUrl = `/${data.complaintAttachment}`;
                documentContainer.innerHTML = `
                    <p><strong>Attached Document:</strong></p>
                    <a href="${fileUrl}" target="_blank">View Complaint Document</a>
                `;
			} else {
				documentContainer.innerHTML = '<p>No document attached.</p>';
			}

            // Status update section
            const statusContainer = document.getElementById('statusContainer');
            statusContainer.innerHTML = `
                <label for="statusSelect"><strong>Update Status:</strong></label>
                <select id="statusSelect">                    
                    <option value="In Progress" ${data.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                    <option value="Completed" ${data.status === 'Completed' ? 'selected' : ''}>Completed</option>
                </select>
                <button onclick="updateComplaintStatus('${data.complaintCode}')">Update Status</button>
            `;
 
			document.getElementById('complaintModal').style.display = "block";
        })
        .catch(error => console.error('Error fetching complaint data:', error));
}

function closeModal() {
    document.getElementById('complaintModal').style.display = "none";
}

function updateComplaintStatus(complaintCode) {
    console.log('Updating status for Complaint Code:', complaintCode);
    
    const newStatus = document.getElementById('statusSelect').value;

    fetch(`/totalcomplaints/${complaintCode}/status`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Status updated successfully!');
            document.getElementById('complaintModal').style.display = "none";
            // Optionally, refresh the page or reload the complaint list
        } else {
            alert('Failed to update status.');
        }
    })
    .catch(error => console.error('Error updating complaint status:', error));
}


window.onclick = function (event) {
    const modal = document.getElementById("complaintModal");
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

//logout
function logout() {
    // Add logout functionality here
    alert("Are you sure you want to log out ?");
        // Add logout functionality here
        //alert("Logged out!");\
        fetch('/logout',{
            method:'POST',
            credentials:'include'
        }).then(response => {
            if(response.redirected){
                window.location.href="/userlogin";
            }
            else{
                alert('Failed to log out');
            }
        }).catch(error => {
            console.log("Error = > ", error);
        });
    }