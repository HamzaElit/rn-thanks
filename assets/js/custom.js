document.addEventListener("DOMContentLoaded", () => {
  // Get all summary elements
  const summaries = document.querySelectorAll(".accordion__quesion");
  // Add click event listener to each summary
  summaries.forEach((summary) => {
    summary.addEventListener("click", function (e) {
      // Prevent the default toggle behavior
      e.preventDefault();

      // Get the details element that contains this summary
      const currentDetails = this.closest("details");

      // Find the closest section parent
      const parentSection = currentDetails.closest("section");

      if (parentSection) {
        // Find all details elements within this section
        const allDetails = parentSection.querySelectorAll(
          "details.accordion__item"
        );

        // Close all other details elements in this section
        allDetails.forEach((details) => {
          if (details !== currentDetails) {
            details.removeAttribute("open");
          }
        });

        // Toggle the current details element
        if (currentDetails.hasAttribute("open")) {
          currentDetails.removeAttribute("open");
        } else {
          currentDetails.setAttribute("open", "");
        }
      }
    });
  });

  // Import EmblaCarousel from the appropriate module

  const embla__sliders = document.querySelectorAll(".embla");

  embla__sliders.forEach((embla__slider) => {
    // Read data attributes
    const slidesToScroll__mobile =
      embla__slider.getAttribute("data-slides-mobile") || 1;
    const slidesToScroll__tab =
      embla__slider.getAttribute("data-slides-tab") || 1;
    const slidesToScroll__desk =
      embla__slider.getAttribute("data-slides-desk") || 1;

    const mobile__only = embla__slider.getAttribute("data-mobile-only") || 0;
    const embla__loop = embla__slider.hasAttribute("data-embla-loop");
    const vertical = embla__slider.hasAttribute("data-vertical");
    const center = embla__slider.hasAttribute("data-center");

    // ⭐ NEW FEATURE (desktop only)
    const centerScale = embla__slider.hasAttribute("data-scale-center");

    const hasProgress = embla__slider.hasAttribute("data-embla-progress");

    // Desktop detection
    const isDesktop = () => window.matchMedia("(min-width: 992px)").matches;

    // Wrapper: only activate scale-center on desktop
    const centerScaleActive = () => centerScale && isDesktop();

    const axis = vertical ? "y" : "x";

    function buildOptions() {
      const scaleActive = centerScaleActive();

      const alignValue = scaleActive || center ? "center" : "start";
      const loopValue = scaleActive ? true : embla__loop;
      const scrollValue = scaleActive ? 1 : slidesToScroll__mobile;

      let options = {};

      if (mobile__only == "1") {
        options = {
          loop: loopValue,
          align: alignValue,
          axis,
          slidesToScroll: scrollValue,
          containScroll: "trimSnaps",
          breakpoints: {
            "(min-width: 768px)": {
              loop: loopValue,
              slidesToScroll: slidesToScroll__tab
            },
            "(min-width: 1280px)": {
              loop: loopValue,
              slidesToScroll: slidesToScroll__desk
            }
          }
        };
      } else {
        options = {
          loop: loopValue,
          align: alignValue,
          axis,
          containScroll: "trimSnaps",
          slidesToScroll: scrollValue,
          breakpoints: {
            "(min-width: 768px)": {
              loop: loopValue,
              slidesToScroll: slidesToScroll__tab
            },
            "(min-width: 992px)": {
              loop: loopValue,
              slidesToScroll: slidesToScroll__desk
            }
          }
        };
      }

      return options;
    }

    const viewportNode = embla__slider.querySelector(".embla__viewport");
    const prevButtonNode = embla__slider.querySelector(".embla__arrow--prev");
    const nextButtonNode = embla__slider.querySelector(".embla__arrow--next");
    const dotsNode = embla__slider.querySelector(".embla__dots");
    const slideNodes = embla__slider.querySelectorAll(".embla__slide");

    const progressNode = embla__slider.querySelector(".embla__progress");
    const progressBarNode = embla__slider.querySelector(".embla__progress-bar");

    const handleSlideVideos = () => {
      if (isDesktop()) return;

      slideNodes.forEach((slide, index) => {
        const video = slide.querySelector(".embla__video");
        if (!video) return;

        if (index === emblaApi.selectedScrollSnap()) {
          video.play().catch(() => {});
        } else {
          video.pause();
          video.currentTime = 0;
        }
      });
    };

    // Init Embla
    const emblaApi = EmblaCarousel(viewportNode, buildOptions());

    // Re-init on resize to enforce desktop-only scale mode
    window.addEventListener("resize", () => {
      emblaApi.reInit(buildOptions());
      updateActiveSlide();
    });

    // Buttons
    prevButtonNode?.addEventListener("click", emblaApi.scrollPrev);
    nextButtonNode?.addEventListener("click", emblaApi.scrollNext);

    const toggleArrowButtonsState = () => {
      if (prevButtonNode) {
        const canScrollPrev = emblaApi.canScrollPrev();
        prevButtonNode.disabled = !canScrollPrev;
        prevButtonNode.classList.toggle("is-disabled", !canScrollPrev);
      }
      if (nextButtonNode) {
        const canScrollNext = emblaApi.canScrollNext();
        nextButtonNode.disabled = !canScrollNext;
        nextButtonNode.classList.toggle("is-disabled", !canScrollNext);
      }
    };

    // Dots
    let dotNodes = [];

    const addDotBtnsWithClickHandlers = () => {
      if (!dotsNode) return;

      const snapCount = emblaApi.scrollSnapList().length;
      if (snapCount <= 1) {
        dotsNode.innerHTML = "";
        return;
      }

      dotsNode.innerHTML = emblaApi
        .scrollSnapList()
        .map(() => '<span class="embla__dot" type="button"></span>')
        .join("");

      dotNodes = [...dotsNode.querySelectorAll(".embla__dot")];
      dotNodes.forEach((dotNode, index) =>
        dotNode.addEventListener("click", () => emblaApi.scrollTo(index))
      );
    };

    const toggleDotBtnsActive = () => {
      if (!dotsNode || dotNodes.length === 0) return;

      const previous = emblaApi.previousScrollSnap();
      const selected = emblaApi.selectedScrollSnap();

      dotNodes[previous]?.classList.remove("embla__dot--selected");
      dotNodes[selected]?.classList.add("embla__dot--selected");
    };

    // ⭐ NEW: Desktop-only active-slide scaling
    const updateActiveSlide = () => {
      const scaleActive = centerScaleActive();

      slideNodes.forEach((slide) => slide.classList.remove("active-slide"));

      if (!scaleActive) return;

      const selected = emblaApi.selectedScrollSnap();
      slideNodes[selected]?.classList.add("active-slide");
    };

    const updateProgressBar = () => {
      if (!hasProgress || !progressBarNode) return;

      requestAnimationFrame(() => {
        const progress = Math.max(0, Math.min(1, emblaApi.scrollProgress()));
        progressBarNode.style.transform = `scaleX(${progress})`;
      });
    };

    const handleProgressClick = (event) => {
      if (!hasProgress || !progressNode) return;

      const rect = progressNode.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const progress = clickX / rect.width;
      const targetScroll = progress * emblaApi.scrollSnapList().length;

      emblaApi.scrollTo(Math.round(targetScroll));
    };

    if (hasProgress && progressNode) {
      progressNode.addEventListener("click", handleProgressClick);
    }

    // Events
    emblaApi
      .on("init", toggleArrowButtonsState)
      .on("select", toggleArrowButtonsState)
      .on("reInit", toggleArrowButtonsState)
      .on("init", addDotBtnsWithClickHandlers)
      .on("reInit", addDotBtnsWithClickHandlers)
      .on("init", toggleDotBtnsActive)
      .on("reInit", toggleDotBtnsActive)
      .on("select", toggleDotBtnsActive)

      // ⭐ activate scaling
      .on("init", updateActiveSlide)
      .on("select", updateActiveSlide)
      .on("reInit", updateActiveSlide)

      .on("init", updateProgressBar)
      .on("scroll", updateProgressBar)
      .on("reInit", updateProgressBar)

      .on("init", handleSlideVideos)
      .on("scroll", handleSlideVideos)
      .on("reInit", handleSlideVideos);
  });
  
});
