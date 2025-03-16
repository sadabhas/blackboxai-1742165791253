import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class Game {
    constructor() {
        // Game state
        this.isPlaying = false;
        this.score = 0;
        this.obstacles = [];
        this.speed = 0.02;
        
        // Initialize scene
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.getElementById('game-container').appendChild(this.renderer.domElement);

        // Setup controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = false;

        // Setup lighting
        this.setupLighting();
        
        // Create game elements
        this.createPlayer();
        this.createGround();
        this.createObstacles();

        // Set initial camera position
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);

        // Bind methods
        this.animate = this.animate.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);

        // Event listeners
        window.addEventListener('resize', this.handleResize);
        window.addEventListener('keydown', this.handleKeyDown);
        
        // UI elements
        this.setupUI();

        // Start animation loop
        this.animate();
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        // Adjust shadow properties
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
    }

    createPlayer() {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
        this.player = new THREE.Mesh(geometry, material);
        this.player.position.y = 0.5;
        this.player.castShadow = true;
        this.scene.add(this.player);
    }

    createGround() {
        const geometry = new THREE.PlaneGeometry(20, 20);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x808080,
            side: THREE.DoubleSide
        });
        this.ground = new THREE.Mesh(geometry, material);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);
    }

    createObstacles() {
        for (let i = 0; i < 5; i++) {
            const geometry = new THREE.BoxGeometry(1, Math.random() * 2 + 1, 1);
            const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
            const obstacle = new THREE.Mesh(geometry, material);
            
            // Random position
            obstacle.position.x = Math.random() * 16 - 8;
            obstacle.position.z = Math.random() * 16 - 8;
            obstacle.position.y = geometry.parameters.height / 2;
            
            obstacle.castShadow = true;
            obstacle.receiveShadow = true;
            
            this.obstacles.push(obstacle);
            this.scene.add(obstacle);
        }
    }

    setupUI() {
        // Get UI elements
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.restartBtn = document.getElementById('restartBtn');
        this.scoreElement = document.getElementById('score');
        this.gameOverScreen = document.getElementById('game-over');
        this.finalScoreElement = document.getElementById('final-score');
        this.playAgainBtn = document.getElementById('playAgainBtn');

        // Add event listeners
        this.startBtn.addEventListener('click', () => this.startGame());
        this.pauseBtn.addEventListener('click', () => this.pauseGame());
        this.restartBtn.addEventListener('click', () => this.restartGame());
        this.playAgainBtn.addEventListener('click', () => this.restartGame());
    }

    startGame() {
        this.isPlaying = true;
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;
        this.restartBtn.disabled = false;
        this.gameOverScreen.classList.add('hidden');
    }

    pauseGame() {
        this.isPlaying = false;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
    }

    restartGame() {
        this.score = 0;
        this.scoreElement.textContent = this.score;
        this.player.position.set(0, 0.5, 0);
        this.gameOverScreen.classList.add('hidden');
        this.startGame();
    }

    gameOver() {
        this.isPlaying = false;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.finalScoreElement.textContent = this.score;
        this.gameOverScreen.classList.remove('hidden');
    }

    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    handleKeyDown(event) {
        if (!this.isPlaying) return;

        const speed = 0.5;
        switch(event.key) {
            case 'ArrowLeft':
            case 'a':
                if (this.player.position.x > -9) this.player.position.x -= speed;
                break;
            case 'ArrowRight':
            case 'd':
                if (this.player.position.x < 9) this.player.position.x += speed;
                break;
            case 'ArrowUp':
            case 'w':
                if (this.player.position.z > -9) this.player.position.z -= speed;
                break;
            case 'ArrowDown':
            case 's':
                if (this.player.position.z < 9) this.player.position.z += speed;
                break;
        }
    }

    checkCollisions() {
        const playerBox = new THREE.Box3().setFromObject(this.player);
        
        for (const obstacle of this.obstacles) {
            const obstacleBox = new THREE.Box3().setFromObject(obstacle);
            if (playerBox.intersectsBox(obstacleBox)) {
                this.gameOver();
                return true;
            }
        }
        return false;
    }

    updateObstacles() {
        for (const obstacle of this.obstacles) {
            obstacle.rotation.y += this.speed;
            
            // Move obstacles
            obstacle.position.x += Math.sin(obstacle.rotation.y) * this.speed;
            obstacle.position.z += Math.cos(obstacle.rotation.y) * this.speed;

            // Keep obstacles within bounds
            if (obstacle.position.x > 9) obstacle.position.x = -9;
            if (obstacle.position.x < -9) obstacle.position.x = 9;
            if (obstacle.position.z > 9) obstacle.position.z = -9;
            if (obstacle.position.z < -9) obstacle.position.z = 9;
        }
    }

    updateScore() {
        if (this.isPlaying) {
            this.score += 1;
            this.scoreElement.textContent = this.score;
            
            // Increase difficulty
            if (this.score % 100 === 0) {
                this.speed *= 1.1;
            }
        }
    }

    animate() {
        requestAnimationFrame(this.animate);

        if (this.isPlaying) {
            this.updateObstacles();
            this.checkCollisions();
            this.updateScore();
        }

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize game when the window loads
window.addEventListener('load', () => {
    try {
        new Game();
    } catch (error) {
        console.error('Failed to initialize game:', error);
        document.body.innerHTML = `
            <div style="color: white; text-align: center; padding: 20px;">
                <h1>Error</h1>
                <p>Failed to initialize game. Please make sure your browser supports WebGL.</p>
            </div>
        `;
    }
});
