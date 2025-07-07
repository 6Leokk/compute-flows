class SpinningWheel {
    constructor() {
        this.wheel = document.getElementById('wheel');
        this.spinButton = document.getElementById('spinButton');
        this.progressFill = document.getElementById('progressFill');
        this.result = document.getElementById('result');
        
        this.isSpinning = false;
        this.isPressing = false;
        this.pressTimer = null;
        this.progressTimer = null;
        this.pressStartTime = 0;
        this.maxPressTime = 2000; // 2 seconds max press time
        this.currentPressTime = 0;
        this.currentRotation = 0; // 跟踪当前旋转角度
        
        this.initEventListeners();
    }
    
    initEventListeners() {
        // Mouse events
        this.spinButton.addEventListener('mousedown', (e) => this.startPress(e));
        this.spinButton.addEventListener('mouseup', (e) => this.endPress(e));
        this.spinButton.addEventListener('mouseleave', (e) => this.endPress(e));
        
        // Touch events for mobile
        this.spinButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startPress(e);
        });
        this.spinButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.endPress(e);
        });
        this.spinButton.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.endPress(e);
        });
        
        // Prevent context menu on long press
        this.spinButton.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    startPress(e) {
        if (this.isSpinning || this.isPressing) return;
        
        this.isPressing = true;
        this.pressStartTime = Date.now();
        this.currentPressTime = 0;
        
        // Start progress bar animation
        this.progressTimer = setInterval(() => {
            this.currentPressTime = Date.now() - this.pressStartTime;
            const progress = Math.min(this.currentPressTime / this.maxPressTime, 1);
            this.progressFill.style.width = `${progress * 100}%`;
            
            // Add some visual feedback
            if (progress > 0.8) {
                this.spinButton.style.transform = 'scale(1.05)';
            }
        }, 16); // ~60fps
    }
    
    endPress(e) {
        if (!this.isPressing) return;
        
        this.isPressing = false;
        clearInterval(this.progressTimer);
        
        // Calculate spin power based on press time
        const pressDuration = this.currentPressTime;
        const spinPower = Math.min(pressDuration / this.maxPressTime, 1);
        
        // Reset button style
        this.spinButton.style.transform = 'scale(1)';
        
        // Only spin if pressed for at least 200ms
        if (pressDuration > 200) {
            this.spin(spinPower);
        }
        
        // Reset progress bar
        setTimeout(() => {
            this.progressFill.style.width = '0%';
        }, 100);
    }
    
    spin(power) {
        if (this.isSpinning) return;
        
        this.isSpinning = true;
        this.result.textContent = '';
        this.result.classList.remove('winner');
        
        // 计算操控的旋转角度
        const riggedRotation = this.calculateRiggedRotation(power);
        
        // 设置最终旋转角度并应用
        this.currentRotation = riggedRotation;
        this.wheel.style.transform = `rotate(${this.currentRotation}deg)`;
        
        // 显示结果
        setTimeout(() => {
            this.showResult();
            this.isSpinning = false;
        }, 4000);
    }
    
    calculateRiggedRotation(power) {
        // 基础旋转圈数 (基于力度2-5圈)
        const baseRotations = Math.floor(2 + power * 3);
        const baseAngle = baseRotations * 360;
        
        // 🦌部分在0-18度范围内，随机选择其中一个位置
        const deerRangeStart = 0;
        const deerRangeEnd = 18;
        const randomDeerPosition = Math.random() * (deerRangeEnd - deerRangeStart) + deerRangeStart;
        
        // 计算最终旋转角度
        // 指针在顶部（0度），我们需要让🦌部分的某个位置对准指针
        // 当前转盘角度 + 基础旋转 + 调整使🦌区域对准指针
        const currentAngleNormalized = this.currentRotation % 360;
        const adjustment = (360 - randomDeerPosition - currentAngleNormalized) % 360;
        const finalRotation = this.currentRotation + baseAngle + adjustment;
        
        return finalRotation;
    }
    
    showResult() {
        // Always show deer as the winner (since it's rigged)
        this.result.textContent = '现在立马🛫';
        this.result.classList.add('winner');
        
        // Add some celebration effect
        this.celebrateWin();
    }
    
    celebrateWin() {
        // Create floating emojis
        const emojis = ['🦌', '✨', '🎉', '🌟'];
        
        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                const emoji = document.createElement('div');
                emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                emoji.style.position = 'fixed';
                emoji.style.left = Math.random() * window.innerWidth + 'px';
                emoji.style.top = '0px';
                emoji.style.fontSize = '2rem';
                emoji.style.zIndex = '1000';
                emoji.style.pointerEvents = 'none';
                emoji.style.animation = 'fall 3s ease-in forwards';
                
                document.body.appendChild(emoji);
                
                // Remove emoji after animation
                setTimeout(() => {
                    document.body.removeChild(emoji);
                }, 3000);
            }, i * 100);
        }
    }
}

// Add falling animation for celebration
const style = document.createElement('style');
style.textContent = `
    @keyframes fall {
        0% {
            transform: translateY(-100px) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize the wheel when page loads
document.addEventListener('DOMContentLoaded', () => {
    new SpinningWheel();
});

// Add some additional "random" behavior to make it look more realistic
document.addEventListener('DOMContentLoaded', () => {
    // Add some random visual effects
    const addRandomGlow = () => {
        const wheel = document.querySelector('.wheel');
        if (wheel && !wheel.classList.contains('spinning')) {
            wheel.style.boxShadow = `0 0 ${20 + Math.random() * 10}px rgba(255,255,255,0.${Math.floor(Math.random() * 3) + 1})`;
        }
    };
    
    setInterval(addRandomGlow, 2000);
});