document.addEventListener("DOMContentLoaded", () => {
  const $ = (s, c = document) => c.querySelector(s),
    $$ = (s, c = document) => [...c.querySelectorAll(s)];

  // Footer year + mobile menu
  $("#year").textContent = new Date().getFullYear();
  $(".menu-btn").addEventListener("click", () => $("#nav").classList.toggle("open"));

  // Gentle entrance for sections
  const io = new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }),
    { threshold: 0.12 },
  );
  $$(".reveal").forEach((el) => io.observe(el));

  // Date inputs: no past dates, checkout after checkin
  const today = new Date().toISOString().split("T")[0];
  const params = new URLSearchParams(location.search);
  $$(".date-in").forEach((i) => {
    i.min = today;
    if (params.get("in")) i.value = params.get("in");
  });
  $$(".date-out").forEach((i) => {
    i.min = today;
    if (params.get("out")) i.value = params.get("out");
  });
  if (params.get("guests") && $("#guests")) $("#guests").value = params.get("guests");
  $$(".date-in").forEach((i) =>
    i.addEventListener("change", () => {
      const out = i.closest("form").querySelector(".date-out");
      const next = new Date(i.value);
      next.setDate(next.getDate() + 1);
      out.min = next.toISOString().split("T")[0];
      if (out.value && out.value <= i.value) out.value = "";
    }),
  );

  // FAQ accordion
  $$(".faq button").forEach((b) =>
    b.addEventListener("click", () => {
      const a = b.nextElementSibling,
        open = b.classList.toggle("open");
      a.style.maxHeight = open ? a.scrollHeight + "px" : 0;
    }),
  );

  // Gallery filter + lightbox
  $$(".filters button").forEach((b) =>
    b.addEventListener("click", () => {
      $$(".filters button").forEach((x) => x.classList.remove("on"));
      b.classList.add("on");
      $$(".g-item").forEach((i) =>
        i.classList.toggle(
          "hide",
          b.dataset.filter !== "all" && i.dataset.cat !== b.dataset.filter,
        ),
      );
    }),
  );
  const lb = $("#lightbox");
  if (lb) {
    $$(".g-item").forEach((i) =>
      i.addEventListener("click", () => {
        const img = $("img", i);
        if (!img) return;
        $("img", lb).src = img.src;
        lb.classList.add("show");
      }),
    );
    lb.addEventListener("click", () => lb.classList.remove("show"));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") lb.classList.remove("show");
    });
  }

  // Booking form
  const form = $("#bookingForm");
  if (!form) return;
  const nights = () => {
    const a = $("#checkin").value,
      b = $("#checkout").value;
    return a && b ? Math.round((new Date(b) - new Date(a)) / 864e5) : 0;
  };
  const updateSummary = () => {
    const n = nights();
    $("#summary").textContent = n > 0 ? `Your stay: ${n} night${n > 1 ? "s" : ""}` : "";
  };
  ["checkin", "checkout"].forEach((id) => $("#" + id).addEventListener("change", updateSummary));
  updateSummary();

  const setErr = (el, msg) => {
    el.closest(".field").classList.toggle("bad", !!msg);
    $(".err", el.closest(".field")).textContent = msg || "";
    return !msg;
  };
  const validate = () => {
    let ok = true;
    ["name", "email", "phone", "idType", "checkin", "checkout", "room"].forEach((id) => {
      const el = $("#" + id);
      let m = "";
      if (!el.value.trim()) m = "This field is required.";
      else if (id === "email" && !/^\S+@\S+\.\S+$/.test(el.value))
        m = "Enter a valid email address.";
      else if (id === "phone" && el.value.replace(/\D/g, "").length < 7)
        m = "Enter a valid phone number.";
      else if (id === "checkin" && el.value < today) m = "Check-in cannot be in the past.";
      else if (id === "checkout" && nights() <= 0) m = "Check-out must be after check-in.";
      if (!setErr(el, m)) ok = false;
    });
    return ok;
  };
  form.addEventListener("input", (e) => {
    if (e.target.closest(".field.bad")) setErr(e.target, "");
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validate()) {
      const f = $(".field.bad input, .field.bad select");
      if (f) f.focus();
      return;
    }
    const v = (id) => $("#" + id).value.trim();
    const ref = "AH-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    const booking = {
      ref,
      name: v("name"),
      email: v("email"),
      phone: v("phone"),
      idType: v("idType"),
      checkin: v("checkin"),
      checkout: v("checkout"),
      nights: nights(),
      room: v("room"),
      rooms: v("rooms"),
      guests: v("guests"),
      arrival: v("arrival"),
      requests: v("requests"),
      made: new Date().toISOString(),
    };

    // Saved in this browser only. Connect a server later to receive bookings centrally.
    try {
      const all = JSON.parse(localStorage.getItem("bookings") || "[]");
      all.push(booking);
      localStorage.setItem("bookings", JSON.stringify(all));
    } catch (_) {}

    $("#ref").textContent = ref;
    const rows = [
      ["Guest", booking.name],
      ["Room", `${booking.room} x ${booking.rooms}`],
      ["Check-in", booking.checkin],
      ["Check-out", booking.checkout],
      ["Nights", booking.nights],
      ["Guests", booking.guests],
      ["Payment", "At the hotel"],
    ];
    $("#details").innerHTML = rows
      .map((r) => `<div><span>${r[0]}</span><strong>${r[1]}</strong></div>`)
      .join("");
    form.style.display = "none";
    $("#confirm").classList.add("show");
    $("#confirm").scrollIntoView({ behavior: "smooth", block: "center" });
  });

  $("#again").addEventListener("click", () => {
    form.reset();
    updateSummary();
    form.style.display = "";
    $("#confirm").classList.remove("show");
  });
});
