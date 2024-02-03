
const updateQuantityBtn = document.querySelector('.btn.btn-outline-primary')
const dropdownBtn = document.querySelector('.btn-dropdown')
const assetDropDownBtn = document.querySelector('#assets')

let initialAsset = 'bitcoin'
let intervalId;

if (updateQuantityBtn) updateQuantityBtn.addEventListener('click', sendQuantityToServer)
if (dropdownBtn) dropdownBtn.addEventListener('click', toggleDropdown)
if (assetDropDownBtn) {
    assetDropDownBtn.addEventListener('change', function () {
        requestGraphDataFromServer({ asset: assetDropDownBtn.value })
    })
}

if (assetDropDownBtn) updateGraphConttroller({ asset: initialAsset })

function requestGraphDataFromServer(asset) {
    fetch('/graphdata', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(asset),
    })
        .then(response => response.json())
        .then(data => {
            initialAsset = data.asset
            if (assetDropDownBtn) updateGraphConttroller({ asset: initialAsset })

        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

function updateGraphOnHomePage(assetName) {
    const img = document.querySelector('.img-fluid')
    const timestamp = new Date().getTime();
    const imgSrc = `../img/${assetName.asset}.png?timestamp=${timestamp}`;
    img.src = imgSrc
}

function updateGraphConttroller(asset) {
    updateGraphOnHomePage(asset)
    if (intervalId) {
        clearInterval(intervalId);
    }
    intervalId = setInterval(() => {
        updateGraphOnHomePage(asset)
    }, 15000)
}

function retrieveQuantitiesFromInputs() {
    const inputs = document.querySelectorAll('.input_node')
    const inputValues = Array.from(inputs).map(input => ({ name: input.name, value: input.value }));
    return inputValues;
}

function sendQuantityToServer() {
    const quantities = retrieveQuantitiesFromInputs()
    fetch("http://192.168.1.111/updatequantities", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(quantities),
    })
        .then((response) => {
            if (response.ok) {
                const successAlert = document.querySelector(".alert.alert-success");
                successAlert.classList.remove("d-none");
                setTimeout(() => {
                    successAlert.classList.add("d-none");
                }, 2000);
            } else {
                const errorAlert = document.querySelector(".alert.alert-danger");
                errorAlert.classList.remove("d-none");
                setTimeout(() => {
                    errorAlert.classList.add("d-none");
                }, 2000);
            }
        })
        .catch((error) => {
            console.error("Error:", error);
        });
}

function toggleDropdown() {
    const dropdown = document.querySelector('.menu-dropdown')
    dropdown.classList.toggle('show')
}

const eventSource = new EventSource('/total');

eventSource.onmessage = (event) => {
    const { total } = JSON.parse(event.data);
    const totalNode = document.querySelector('.total-balance-value')
    if(totalNode) totalNode.textContent = `${total}€`
};

eventSource.onerror = function (error) {
    console.error("EventSource error:", JSON.stringify(error));
  };