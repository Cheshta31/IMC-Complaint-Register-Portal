const body = document.querySelector("body"),
      modeToggle = body.querySelector(".mode-toggle");
      sidebar = body.querySelector("nav");
      sidebarToggle = body.querySelector(".sidebar-toggle");

let getMode = localStorage.getItem("mode");
if(getMode && getMode ==="dark"){
    body.classList.toggle("dark");
}

let getStatus = localStorage.getItem("status");
if(getStatus && getStatus ==="close"){
    sidebar.classList.toggle("close");
}

modeToggle.addEventListener("click", () =>{
    body.classList.toggle("dark");
    if(body.classList.contains("dark")){
        localStorage.setItem("mode", "dark");
    }else{
        localStorage.setItem("mode", "light");
    }
});

sidebarToggle.addEventListener("click", () => {
    sidebar.classList.toggle("close");
    if(sidebar.classList.contains("close")){
        localStorage.setItem("status", "close");
    }else{
        localStorage.setItem("status", "open");
    }
})


function togglePopup() {
    const popup = document.getElementById('profilePopup');
    popup.classList.toggle('show');
}

function editProfile() {
    alert('Edit Profile clicked');
}

function manageGoogleAccount() {
    alert('Manage your Google Account clicked');
}

function navigateTo(option) {
    //alert(Navigating to ${option});
    // Here you can add the logic to navigate to different pages or sections
    // For example:
    // if (option === 'your-profile') {
    //     window.location.href = '/your-profile';
    // }
}

// Close the popup when clicking outside of it
window.onclick = function(event) {
    const popup = document.getElementById('profilePopup');
    if (event.target !== popup && !popup.contains(event.target) && event.target.className !== 'profile-button') {
        popup.classList.remove('show');
    }
}

function openModal(_id) {
    fetch(`/mycomplaint/${_id}`)
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
            /*const statusContainer = document.getElementById('statusContainer');
            statusContainer.innerHTML = `
                <label for="statusSelect"><strong>Update Status:</strong></label>
                <select id="statusSelect">                    
                    <option value="In Progress" ${data.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                    <option value="Completed" ${data.status === 'Completed' ? 'selected' : ''}>Completed</option>
                </select>
                <button onclick="updateComplaintStatus('${data.complaintCode}')">Update Status</button>
            `;*/
 
			document.getElementById('complaintModal').style.display = "block";
        })
        .catch(error => console.error('Error fetching complaint data:', error));
}

function closeModal() {
    document.getElementById('complaintModal').style.display = "none";
}

/*function updateComplaintStatus(complaintCode) {
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
}*/

// Close the modal when clicking outside of the modal content
window.onclick = function(event) {
    var modal = document.getElementById("modal");
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

function toggleDropdown() {
    var dropdown = document.getElementById("dropdown");
    if (dropdown.style.display === "none" || dropdown.style.display === "") {
        dropdown.style.display = "block";
    } else {
        dropdown.style.display = "none";
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

// Close the dropdown if the user clicks outside of it
window.onclick = function(event) {
    if (!event.target.matches('.nav-link img')) {
        var dropdown = document.getElementById("dropdown");
        if (dropdown.style.display === "block") {
            dropdown.style.display = "none";
        }
    }
}