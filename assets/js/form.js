const API = "http://localhost:3000/contacts";
const form = document.getElementById("contactForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();

  if (!firstName || !lastName || !email || !phone) {
    alert("All fields are required!");
    return;
  }

  const newContact = {
    firstName,
    lastName,
    email,
    phone,
    createdAt: Date.now(),
  };

  await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newContact),
  });

  alert("Contact Added!");
  window.location.href = "index.html";
});
