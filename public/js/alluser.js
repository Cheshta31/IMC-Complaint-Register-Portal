const allSideMenu = document.querySelectorAll('#sidebar .side-menu.top li a');

allSideMenu.forEach(item=> {
	const li = item.parentElement;

	item.addEventListener('click', function () {
		allSideMenu.forEach(i=> {
			i.parentElement.classList.remove('active');
		})
		li.classList.add('active');
	})
});
// TOGGLE SIDEBAR
const menuBar = document.querySelector('#content nav .bx.bx-menu');
const sidebar = document.getElementById('sidebar');

menuBar.addEventListener('click', function () {
	sidebar.classList.toggle('hide');
})

const searchButton = document.querySelector('#content nav form .form-input button');
const searchButtonIcon = document.querySelector('#content nav form .form-input button .bx');
const searchForm = document.querySelector('#content nav form');

searchButton.addEventListener('click', function (e) {
	if(window.innerWidth < 576) {
		e.preventDefault();
		searchForm.classList.toggle('show');
		if(searchForm.classList.contains('show')) {
			searchButtonIcon.classList.replace('bx-search', 'bx-x');
		} else {
			searchButtonIcon.classList.replace('bx-x', 'bx-search');
		}
	}
})

if(window.innerWidth < 768) {
	sidebar.classList.add('hide');
} else if(window.innerWidth > 576) {
	searchButtonIcon.classList.replace('bx-x', 'bx-search');
	searchForm.classList.remove('show');
}


window.addEventListener('resize', function () {
	if(this.innerWidth > 576) {
		searchButtonIcon.classList.replace('bx-x', 'bx-search');
		searchForm.classList.remove('show');
	}
})



const switchMode = document.getElementById('switch-mode');

switchMode.addEventListener('change', function () {
	if(this.checked) {
		document.body.classList.add('dark');
	} else {
		document.body.classList.remove('dark');
	}
})


function togglePopup() {
    const popup = document.getElementById('profilePopup');
    popup.classList.toggle('show');
}

function navigateTo(option) {
    alert(`Navigating to ${option}`);
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


function deleteUser(employeeID) {
    // Add your delete user logic here
    //alert('User deleted'); {
        if (confirm('Are you sure you want to delete this user?')) {
            fetch(`/alluser/${employeeID}`, {
                method: 'DELETE',
            })
            .then(response => {
                if (response.ok) {
                    alert('User deleted successfully');
                    
                } else {
                    alert('Failed to delete users');
                }
            })
            .catch(error => {
                console.error('Error deleting user:', error);
                alert('An error occurred while deleting the user');
            });
        }
}

function togglePopup() {
    const popup = document.getElementById('profilePopup');
    popup.classList.toggle('show');
}

function navigateTo(option) {
    alert(`Navigating to ${option}`);
    // Here you can add the logic to navigate to different pages or sections
    // For example:
    // if (option === 'your-profile') {
    //     window.location.href = '/your-profile';
    // }
}

async function addUser(event) {
    event.preventDefault(); // Prevent the default form submission

    const form = document.getElementById("newuser");
    const formData = new FormData(form);

    const data = {};
    formData.forEach((value, key) => {
        data[key] = value;
    });

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const result = await response.json();
            //console.log(result.message);
            alert(result.message);
            console.log("User registered successfully");
            form.reset();
        } else {
            const errorResult = await response.json();
            alert("Not able to register the user");
            console.error('Error:', errorResult.message)
        }
    } catch (error) {
        console.error('Network error:', error);
    }
}

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
