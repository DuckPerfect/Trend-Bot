// Advanced Performance Optimizer - Fixed
class PerformanceOptimizer {
  constructor() {
    this.debounceTimers = new Map();
    this.throttleTimers = new Map();
    this.rafCallbacks = new Set();
    this.intersectionObserver = null;
    this.resizeObserver = null;
    this.mutationObserver = null;
    this.performanceMetrics = {
      fps: 60,
      memoryUsage: 0,
      apiCalls: 0,
      renderTime: 0
    };
    
    this.init();
  }

  init() {
    this.setupObservers();
    this.setupPerformanceMonitoring();
    this.optimizeScrolling();
    this.setupImageLazyLoading();
  }

  // Enhanced debouncing with priority levels
  debounce(func, delay, key, priority = 'normal') {
    const self = this;
    
    return function(...args) {
      if (self.debounceTimers.has(key)) {
        clearTimeout(self.debounceTimers.get(key));
      }
      
      const actualDelay = priority === 'high' ? delay * 0.5 : 
                        priority === 'low' ? delay * 1.5 : delay;
      
      const timer = setTimeout(() => {
        func.apply(this, args);
        self.debounceTimers.delete(key);
      }, actualDelay);
      
      self.debounceTimers.set(key, timer);
    };
  }

  // Enhanced throttling with frame-based execution
  throttle(func, delay, key) {
    const self = this;
    
    return function(...args) {
      if (self.throttleTimers.has(key)) {
        return;
      }
      
      self.requestAnimationFrame(() => {
        func.apply(this, args);
        setTimeout(() => {
          self.throttleTimers.delete(key);
        }, delay);
      });
      
      self.throttleTimers.set(key, true);
    };
  }

  // Optimized requestAnimationFrame with batching
  requestAnimationFrame(callback) {
    this.rafCallbacks.add(callback);
    
    if (this.rafCallbacks.size === 1) {
      requestAnimationFrame(() => {
        const callbacks = Array.from(this.rafCallbacks);
        this.rafCallbacks.clear();
        
        const startTime = performance.now();
        callbacks.forEach(cb => cb());
        const endTime = performance.now();
        
        this.performanceMetrics.renderTime = endTime - startTime;
      });
    }
  }

  // Setup advanced observers - FIXED
  setupObservers() {
    // Intersection Observer for lazy loading and visibility tracking
    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.handleElementVisible(entry.target);
            } else {
              this.handleElementHidden(entry.target);
            }
          });
        },
        { 
          rootMargin: '50px',
          threshold: [0, 0.25, 0.5, 0.75, 1]
        }
      );
    }

    // Resize Observer for responsive updates - FIXED
    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(
        this.debounce(() => {
          this.handleResize();
        }, 100, 'resize', 'high')
      );
      this.resizeObserver.observe(document.body);
    }

    // Mutation Observer for DOM changes
    if ('MutationObserver' in window) {
      this.mutationObserver = new MutationObserver(
        this.throttle((mutations) => {
          this.handleDOMChanges(mutations);
        }, 100, 'mutation')
      );
      
      this.mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style']
      });
    }
  }

  // Performance monitoring
  setupPerformanceMonitoring() {
    let lastTime = performance.now();
    let frames = 0;
    
    const updateFPS = () => {
      frames++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        this.performanceMetrics.fps = Math.round((frames * 1000) / (currentTime - lastTime));
        frames = 0;
        lastTime = currentTime;
        
        this.updatePerformanceDisplay();
      }
      
      requestAnimationFrame(updateFPS);
    };
    
    requestAnimationFrame(updateFPS);
    
    // Memory monitoring
    if (performance.memory) {
      setInterval(() => {
        this.performanceMetrics.memoryUsage = Math.round(
          performance.memory.usedJSHeapSize / 1048576
        );
        this.updatePerformanceDisplay();
      }, 2000);
    }
  }

  // Optimize scrolling performance
  optimizeScrolling() {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        this.requestAnimationFrame(() => {
          this.handleScrollOptimized();
          ticking = false;
        });
        ticking = true;
      }
    };
    
    document.addEventListener('scroll', handleScroll, { passive: true });
    
    // Smooth scrolling for better UX
    if (CSS.supports('scroll-behavior', 'smooth')) {
      document.documentElement.style.scrollBehavior = 'smooth';
    }
  }

  // Advanced image lazy loading
  setupImageLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    images.forEach(img => {
      this.intersectionObserver?.observe(img);
      
      // Add loading placeholder
      img.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      img.style.backgroundImage = 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)';
      img.style.backgroundSize = '200% 100%';
      img.style.animation = 'shimmer 1.5s infinite';
    });
  }

  // Handle element visibility changes
  handleElementVisible(element) {
    // Lazy load images
    if (element.tagName === 'IMG' && element.dataset.src) {
      this.loadImage(element);
    }
    
    // Start animations for visible elements
    if (element.dataset.animate) {
      element.classList.add('animate-in');
    }
    
    // Resume video playback
    if (element.tagName === 'VIDEO') {
      element.play?.();
    }
  }

  handleElementHidden(element) {
    // Pause video playback
    if (element.tagName === 'VIDEO') {
      element.pause?.();
    }
    
    // Stop animations for hidden elements
    if (element.dataset.animate) {
      element.classList.remove('animate-in');
    }
  }

  // Optimized image loading - FIXED METHOD NAME
  loadImage(img) {
    const src = img.dataset.src;
    if (!src) return;
    
    const image = new Image();
    image.onload = () => {
      this.requestAnimationFrame(() => {
        img.src = src;
        img.removeAttribute('data-src');
        img.classList.add('loaded');
        img.style.animation = 'none';
      });
    };
    
    image.onerror = () => {
      img.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
      img.style.animation = 'none';
    };
    
    image.src = src;
  }

  // Handle resize events
  handleResize() {
    // Dispatch custom resize event
    window.dispatchEvent(new CustomEvent('optimizedResize'));
  }

  // Handle DOM changes
  handleDOMChanges(mutations) {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.optimizeNewElement(node);
          }
        });
      }
    });
  }

  // Optimize newly added elements
  optimizeNewElement(element) {
    // Add to intersection observer
    if (element.tagName === 'IMG' && element.dataset.src) {
      this.intersectionObserver?.observe(element);
    }
    
    // Add GPU acceleration to animated elements
    if (element.dataset.animate || element.classList.contains('animate')) {
      element.style.transform = 'translateZ(0)';
      element.style.willChange = 'transform, opacity';
    }
  }

  // Handle optimized scrolling
  handleScrollOptimized() {
    const scrollTop = window.pageYOffset;
    
    // Update scroll-dependent elements
    document.querySelectorAll('[data-scroll-effect]').forEach(element => {
      const effect = element.dataset.scrollEffect;
      
      switch (effect) {
        case 'parallax':
          this.applyParallaxEffect(element, scrollTop);
          break;
        case 'fade':
          this.applyFadeEffect(element, scrollTop);
          break;
        case 'scale':
          this.applyScaleEffect(element, scrollTop);
          break;
      }
    });
  }

  // Apply parallax effect
  applyParallaxEffect(element, scrollTop) {
    const speed = parseFloat(element.dataset.parallaxSpeed) || 0.5;
    const yPos = -(scrollTop * speed);
    element.style.transform = `translateY(${yPos}px) translateZ(0)`;
  }

  // Apply fade effect
  applyFadeEffect(element, scrollTop) {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const opacity = Math.max(0, Math.min(1, 1 - (rect.top / windowHeight)));
    element.style.opacity = opacity;
  }

  // Apply scale effect
  applyScaleEffect(element, scrollTop) {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const scale = Math.max(0.8, Math.min(1, 1 - (rect.top / windowHeight) * 0.2));
    element.style.transform = `scale(${scale}) translateZ(0)`;
  }

  // Update performance display
  updatePerformanceDisplay() {
    const monitor = document.getElementById('performanceMonitor');
    if (!monitor) return;
    
    const fpsCounter = document.getElementById('fpsCounter');
    const memoryUsage = document.getElementById('memoryUsage');
    const apiCallCount = document.getElementById('apiCallCount');
    
    if (fpsCounter) fpsCounter.textContent = this.performanceMetrics.fps;
    if (memoryUsage) memoryUsage.textContent = this.performanceMetrics.memoryUsage;
    if (apiCallCount) apiCallCount.textContent = this.performanceMetrics.apiCalls;
    
    // Show warning if performance is poor
    if (this.performanceMetrics.fps < 30) {
      monitor.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
    } else if (this.performanceMetrics.fps < 50) {
      monitor.style.backgroundColor = 'rgba(255, 165, 0, 0.8)';
    } else {
      monitor.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    }
  }

  // Memory management
  cleanup() {
    // Clear timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    this.throttleTimers.clear();
    this.rafCallbacks.clear();
    
    // Disconnect observers
    this.intersectionObserver?.disconnect();
    this.resizeObserver?.disconnect();
    this.mutationObserver?.disconnect();
  }

  // Performance metrics API
  getMetrics() {
    return { ...this.performanceMetrics };
  }

  incrementApiCalls() {
    this.performanceMetrics.apiCalls++;
    this.updatePerformanceDisplay();
  }

  // Enable performance monitoring
  enableMonitoring() {
    const monitor = document.getElementById('performanceMonitor');
    if (monitor) {
      monitor.style.display = 'block';
    }
  }

  // Disable performance monitoring
  disableMonitoring() {
    const monitor = document.getElementById('performanceMonitor');
    if (monitor) {
      monitor.style.display = 'none';
    }
  }
}

// Export for global use
window.PerformanceOptimizer = PerformanceOptimizer;

// Auto-initialize if not in module environment
if (typeof module === 'undefined') {
  window.performanceOptimizer = new PerformanceOptimizer();
  
  // Enable monitoring in development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.performanceOptimizer.enableMonitoring();
  }
}