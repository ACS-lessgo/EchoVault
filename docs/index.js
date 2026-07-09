lucide.createIcons()

// Mobile nav toggle
const navToggle = document.querySelector(".nav-toggle")
const navLinks = document.querySelector(".nav-links")

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open")
    navToggle.setAttribute("aria-expanded", String(isOpen))
  })

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open")
      navToggle.setAttribute("aria-expanded", "false")
    })
  })
}

// Copy CLI install command
document.querySelectorAll(".copy-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const text = btn.dataset.copy
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const textarea = document.createElement("textarea")
      textarea.value = text
      textarea.style.position = "fixed"
      textarea.style.opacity = "0"
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
    }

    btn.classList.add("copied")
    const originalLabel = btn.getAttribute("aria-label")
    btn.setAttribute("aria-label", "Copied!")
    setTimeout(() => {
      btn.classList.remove("copied")
      btn.setAttribute("aria-label", originalLabel)
    }, 1500)
  })
})

// Screenshot Lightbox
const lightbox = document.getElementById("lightbox")
const lightboxImg = document.getElementById("lightbox-img")
const closeBtn = document.querySelector(".lightbox-close")

document.querySelectorAll(".screenshot-gallery img").forEach((img) => {
  img.addEventListener("click", () => {
    lightboxImg.src = img.src
    lightbox.classList.remove("hidden")
  })
})

// Close on X click
closeBtn.addEventListener("click", () => {
  lightbox.classList.add("hidden")
})

// Close on outside click
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) {
    lightbox.classList.add("hidden")
  }
})

// Close on ESC key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    lightbox.classList.add("hidden")
  }
})

// Scroll-reveal for feature/screenshot cards
const revealEls = document.querySelectorAll(".reveal")

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible")
          observer.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.15 },
  )

  revealEls.forEach((el) => revealObserver.observe(el))
} else {
  revealEls.forEach((el) => el.classList.add("is-visible"))
}
