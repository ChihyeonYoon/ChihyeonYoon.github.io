document.addEventListener('DOMContentLoaded', () => {
    // 1. Background Particles Canvas Animation
    const canvas = document.getElementById('particles-canvas');
    const ctx = canvas.getContext('2d');

    let particles = [];
    const particleCount = 45;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 0.5;
            this.speedX = Math.random() * 0.2 - 0.1;
            this.speedY = Math.random() * 0.2 - 0.1;
            this.opacity = Math.random() * 0.5 + 0.1;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            // Boundary wrapping
            if (this.x < 0) this.x = canvas.width;
            if (this.x > canvas.width) this.x = 0;
            if (this.y < 0) this.y = canvas.height;
            if (this.y > canvas.height) this.y = 0;
        }

        draw() {
            ctx.fillStyle = `rgba(71, 85, 105, ${this.opacity * 0.4})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function initParticles() {
        particles = [];
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
        }
        requestAnimationFrame(animateParticles);
    }

    initParticles();
    animateParticles();

    // 2. Scroll Reveal Effects
    const reveals = document.querySelectorAll('.reveal');

    function checkReveal() {
        const triggerBottom = (window.innerHeight / 10) * 8.8;

        reveals.forEach(reveal => {
            const revealTop = reveal.getBoundingClientRect().top;

            if (revealTop < triggerBottom) {
                reveal.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', checkReveal);
    checkReveal(); // Trigger once on load

    // 3. Chatbot Widget Logic
    const toggleBtn = document.getElementById('chat-toggle-btn');
    const chatWindow = document.getElementById('chat-window');
    const closeBtn = document.getElementById('close-chat');
    const sendBtn = document.getElementById('send-btn');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

    const WORKER_URL = "https://y-chihyeon.vercel.app/api"; 
    const toggleIcon = document.getElementById('chat-toggle-icon');
    const toggleText = document.getElementById('chat-toggle-text');
    let isOpen = false;
    let chatHistory = [];

    // Focus state for chat input
    chatInput.onfocus = () => {
        chatInput.style.borderColor = 'var(--accent-blue)';
        chatInput.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.2)';
    };
    chatInput.onblur = () => {
        chatInput.style.borderColor = 'rgba(255,255,255,0.1)';
        chatInput.style.boxShadow = 'none';
    };

    toggleBtn.onclick = () => {
        isOpen = !isOpen;
        chatWindow.style.display = isOpen ? 'flex' : 'none';
        if (isOpen) {
            toggleIcon.textContent = '✕';
            toggleText.textContent = 'Close';
            toggleBtn.style.background = 'linear-gradient(135deg, #ef4444, #ec4899)';
            toggleBtn.style.boxShadow = '0 8px 25px rgba(239, 68, 68, 0.3)';
        } else {
            toggleIcon.textContent = '💬';
            toggleText.textContent = 'Talk to RAG Assistant';
            toggleBtn.style.background = 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))';
            toggleBtn.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.3)';
        }
    };

    closeBtn.onclick = () => {
        isOpen = false;
        chatWindow.style.display = 'none';
        toggleIcon.textContent = '💬';
        toggleText.textContent = 'Talk to RAG Assistant';
        toggleBtn.style.background = 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))';
        toggleBtn.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.3)';
    };

    function addMessage(sender, text) {
        const msgDiv = document.createElement('div');
        msgDiv.style.padding = '10px 14px';
        msgDiv.style.borderRadius = sender === 'user' ? '12px 12px 0px 12px' : '12px 12px 12px 0px';
        msgDiv.style.maxWidth = '85%';
        msgDiv.style.wordBreak = 'break-word';
        msgDiv.style.fontSize = '0.85rem';
        msgDiv.style.lineHeight = '1.4';
        
        if (sender === 'user') {
            msgDiv.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(139, 92, 246, 0.25))';
            msgDiv.style.border = '1px solid rgba(96, 165, 250, 0.3)';
            msgDiv.style.color = '#e0f2fe';
            msgDiv.style.alignSelf = 'flex-end';
            msgDiv.textContent = text;
        } else {
            msgDiv.style.background = 'rgba(255, 255, 255, 0.04)';
            msgDiv.style.border = '1px solid rgba(255, 255, 255, 0.08)';
            msgDiv.style.color = 'var(--text-secondary)';
            msgDiv.style.alignSelf = 'flex-start';
            
            // Format simple markdown lists
            if (text.includes('*') || text.includes('-')) {
                let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                html = html.replace(/^\* (.*?)$/gm, '<li>$1</li>');
                html = html.replace(/^- (.*?)$/gm, '<li>$1</li>');
                html = html.replace(/\n/g, '<br/>');
                msgDiv.innerHTML = html;
            } else {
                msgDiv.innerHTML = text.replace(/\n/g, '<br/>');
            }
        }
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return msgDiv;
    }

    sendBtn.onclick = async () => {
        const text = chatInput.value.trim();
        if (!text) return;
        
        addMessage('user', text);
        chatInput.value = '';
        chatHistory.push({ role: 'user', text: text });
        const isKo = document.body.classList.contains('lang-ko');
        const loadingText = isKo ? '생각 중...' : 'Thinking...';
        const loadingMsg = addMessage('ai', `<span style="color: var(--text-muted);">${loadingText}</span>`);
        
        try {
            const response = await fetch(WORKER_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: text, history: chatHistory.slice(-4) })
            });
            
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Server error");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let fullResponse = "";
            loadingMsg.innerHTML = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.slice(6);
                        if (dataStr.trim() === "[DONE]") continue;
                        try {
                            const data = JSON.parse(dataStr);
                            const chunkText = data.candidates[0].content.parts[0].text;
                            fullResponse += chunkText;
                            
                            let html = fullResponse.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                            html = html.replace(/^\* (.*?)$/gm, '<li>$1</li>');
                            html = html.replace(/^- (.*?)$/gm, '<li>$1</li>');
                            html = html.replace(/\n/g, '<br/>');
                            
                            loadingMsg.innerHTML = html;
                            chatMessages.scrollTop = chatMessages.scrollHeight;
                        } catch(e) {}
                    }
                }
            }
            if (fullResponse) {
                chatHistory.push({ role: 'model', text: fullResponse });
            }
        } catch (e) {
            console.error("Chat error:", e);
            const errorText = isKo ? '오류 발생: ' : 'Error: ';
            loadingMsg.innerHTML = '<span style="color: #ef4444;">❌ ' + errorText + e.message + '</span>';
        }
    };

    chatInput.onkeypress = (e) => { if (e.key === 'Enter') sendBtn.click(); };

    // 4. Image Lightbox Zoom & Pan Feature
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxClose = document.getElementById('lightbox-close');
    const zoomableImages = document.querySelectorAll('.project-img-display');
    
    // Zoom control elements
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const zoomResetBtn = document.getElementById('zoom-reset-btn');
    const imgContainer = document.getElementById('lightbox-img-container');

    let scale = 1;
    let translateX = 0;
    let translateY = 0;
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    function updateTransform() {
        lightboxImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }

    function resetZoom() {
        scale = 1;
        translateX = 0;
        translateY = 0;
        updateTransform();
    }

    zoomableImages.forEach(img => {
        img.addEventListener('click', () => {
            lightboxImg.src = img.src;
            lightboxImg.alt = img.alt;
            lightboxCaption.textContent = img.alt;
            
            resetZoom(); // Reset transform to default states when opening new image
            
            lightbox.style.display = 'flex';
            // Force reflow for transitions
            lightbox.offsetHeight;
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden'; // Lock background scrolling
        });
    });

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = ''; // Unlock background scrolling
        setTimeout(() => {
            if (!lightbox.classList.contains('active')) {
                lightbox.style.display = 'none';
                lightboxImg.src = '';
            }
        }, 300);
    }

    // Zoom controls event listeners
    zoomInBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        scale = Math.min(scale + 0.25, 4);
        updateTransform();
    });

    zoomOutBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        scale = Math.max(scale - 0.25, 0.5);
        if (scale === 0.5) {
            translateX = 0;
            translateY = 0;
        }
        updateTransform();
    });

    zoomResetBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        resetZoom();
    });

    // Mouse Wheel Zoom
    imgContainer.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomIntensity = 0.1;
        if (e.deltaY < 0) {
            scale = Math.min(scale + zoomIntensity, 4);
        } else {
            scale = Math.max(scale - zoomIntensity, 0.5);
            if (scale === 0.5) {
                translateX = 0;
                translateY = 0;
            }
        }
        updateTransform();
    }, { passive: false });

    // Drag-to-Pan logic
    imgContainer.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isDragging = true;
        imgContainer.classList.add('dragging');
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        updateTransform();
    });

    window.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            imgContainer.classList.remove('dragging');
        }
    });

    lightboxClose.addEventListener('click', closeLightbox);
    
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) {
            closeLightbox();
        }
    });

    // 5. Language Switcher Logic
    const koBtn = document.getElementById('lang-ko-btn');
    const enBtn = document.getElementById('lang-en-btn');

    function setLanguage(lang) {
        if (lang === 'ko') {
            document.body.className = 'lang-ko';
            koBtn.classList.add('active');
            enBtn.classList.remove('active');
            localStorage.setItem('portfolio-lang', 'ko');
            if (chatInput) chatInput.placeholder = "질문을 입력하세요...";
            if (toggleText && !isOpen) toggleText.textContent = "비서봇과 대화하기";
            document.title = "윤치현 | AI 연구원 포트폴리오";
            if (zoomInBtn) zoomInBtn.title = "확대";
            if (zoomOutBtn) zoomOutBtn.title = "축소";
            if (zoomResetBtn) zoomResetBtn.title = "원래 크기";
        } else {
            document.body.className = 'lang-en';
            enBtn.classList.add('active');
            koBtn.classList.remove('active');
            localStorage.setItem('portfolio-lang', 'en');
            if (chatInput) chatInput.placeholder = "Ask about projects, papers, or experience...";
            if (toggleText && !isOpen) toggleText.textContent = "Talk to RAG Assistant";
            document.title = "Chihyeon Yun | AI Researcher Portfolio";
            if (zoomInBtn) zoomInBtn.title = "Zoom In";
            if (zoomOutBtn) zoomOutBtn.title = "Zoom Out";
            if (zoomResetBtn) zoomResetBtn.title = "Reset Size";
        }
    }

    // 6. Copy Email to Clipboard & Show Premium Toast
    const emailBtn = document.getElementById('email-btn');
    if (emailBtn) {
        emailBtn.addEventListener('click', (e) => {
            const email = "chichi8969@naver.com";
            navigator.clipboard.writeText(email).then(() => {
                showToast(email);
            }).catch(err => {
                console.error("Clipboard copy failed:", err);
            });
        });
    }

    function showToast(email) {
        const existingToast = document.getElementById('email-toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.id = 'email-toast';
        const isKo = document.body.classList.contains('lang-ko');
        if (isKo) {
            toast.innerHTML = `✉️ 이메일 주소가 복사되었습니다!<br><strong style="font-size: 0.9rem;">${email}</strong>`;
        } else {
            toast.innerHTML = `✉️ Email copied to clipboard!<br><strong style="font-size: 0.9rem;">${email}</strong>`;
        }
        document.body.appendChild(toast);
        toast.offsetHeight; // force reflow
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

    koBtn.addEventListener('click', () => setLanguage('ko'));
    enBtn.addEventListener('click', () => setLanguage('en'));

    // Load saved language or default to 'en'
    const savedLang = localStorage.getItem('portfolio-lang') || 'en';
    setLanguage(savedLang);
});
