
const updateQuantityBtn = document.querySelector('.btn.btn-outline-primary')
const dropdownBtn = document.querySelector('.btn-dropdown')
const assetDropDownBtn = document.querySelector('#assets')
if (updateQuantityBtn) updateQuantityBtn.addEventListener('click', sendDataToServer)
if (dropdownBtn) dropdownBtn.addEventListener('click', toggleDropdown)
if (assetDropDownBtn) assetDropDownBtn.addEventListener('change', requestGraphData(assetDropDownBtn.value))

function updateQuantities() {
    const inputs = document.querySelectorAll('.input_node')
    const inputValues = inputs.map(input => ({ name: input.name, value: input.value }));
    return inputValues;
}

function sendDataToServer() {
    const data = updateQuantities()
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "http://192.168.1.111/updatequantities", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(data));
    xhr.onreadystatechange = function () {
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            const successAlert = document.querySelector('.alert.alert-success')
            successAlert.classList.remove('d-none')
            setTimeout(() => {
                successAlert.classList.add('d-none')
            }, 2000)
        } else if (this.readyState === XMLHttpRequest.DONE && this.status !== 200) {
            const errorAlert = document.querySelector('.alert.alert-danger')
            errorAlert.classList.remove('d-none')
            setTimeout(() => {
                errorAlert.classList.add('d-none')
            }, 2000)
        }
    }
}

function toggleDropdown() {
    const dropdown = document.querySelector('.menu-dropdown')
    dropdown.classList.toggle('show')
}

function requestGraphData(assetName) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "http://192.168.1.111/graphdata", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(assetName));
    xhr.onreadystatechange = function () {
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            console.log('success');
        }
    }   
}

function updateGraphOnHomePage() {
    const img = document.querySelector('.img-fluid')
    const timestamp = new Date().getTime();
    const imgSrc = `../img/bitcoin.png?timestamp=${timestamp}`;
    img.src = imgSrc
}

updateGraphOnHomePage()
setInterval(updateGraphOnHomePage, 15000)