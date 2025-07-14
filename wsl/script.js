document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Elements ---
    const wizard = document.getElementById('wizard');
    const steps = Array.from(wizard.getElementsByClassName('step'));
    const nextButtons = Array.from(wizard.getElementsByClassName('next-btn'));
    const prevButtons = Array.from(wizard.getElementsByClassName('prev-btn'));
    const restartButton = document.getElementById('restart-btn');

    const distroSelect = document.getElementById('distro-name');
    const distroOtherInput = document.getElementById('distro-name-other');
    const usernameInput = document.getElementById('windows-username');
    const userPlaceholder = document.querySelector('.user-placeholder');

    const securityModeRadios = document.getElementsByName('security-mode');
    const accessScopeRadios = document.getElementsByName('access-scope');

    const folderPathGroup = document.getElementById('folder-path-group');
    const folderPathInput = document.getElementById('folder-path');
    const diskPathGroup = document.getElementById('disk-path-group');
    const diskPathInput = document.getElementById('disk-path');
    
    const tutorialOutput = document.getElementById('tutorial-output');
    const expansionContent = document.getElementById('disk-expansion-content');


    // --- State Management ---
    let currentStep = 1;
    const userChoices = {
        distroName: 'Ubuntu-22.04',
        targetDrive: 'E:',
        username: '',
        securityMode: 'isolated',
        accessScope: 'folder',
        folderPath: '',
        diskPath: ''
    };


    // --- Functions ---
    const updateStepVisibility = () => {
        steps.forEach(step => {
            step.classList.toggle('active', parseInt(step.dataset.step) === currentStep);
        });
    };

    const navigateNext = () => {
        // Collect data from current step before moving
        updateUserChoices();
        
        let nextStep = currentStep + 1;

        // Skip step 3 if security mode is 'default'
        if (currentStep === 2 && userChoices.securityMode === 'default') {
            nextStep++; // Skip to step 4
        }
        
        if (nextStep <= steps.length) {
            currentStep = nextStep;
            updateStepVisibility();
        }
        
        // If we landed on the final step, generate the tutorial
        if (currentStep === 4) {
            generateTutorial();
        }
    };

    const navigatePrev = () => {
        let prevStep = currentStep - 1;
        
        // If going back from step 4 and skipped step 3
        if (currentStep === 4 && userChoices.securityMode === 'default') {
            prevStep--; // Skip back to step 2
        }

        if (prevStep >= 1) {
            currentStep = prevStep;
            updateStepVisibility();
        }
    };
    
    const updateUserChoices = () => {
        // Step 1
        userChoices.distroName = distroSelect.value === 'other' ? distroOtherInput.value : distroSelect.value;
        userChoices.targetDrive = document.getElementById('target-drive').value || 'E:';
        userChoices.username = usernameInput.value || 'your_username';

        // Step 2
        const selectedSecurityMode = Array.from(securityModeRadios).find(r => r.checked);
        if (selectedSecurityMode) userChoices.securityMode = selectedSecurityMode.value;

        // Step 3
        const selectedAccessScope = Array.from(accessScopeRadios).find(r => r.checked);
        if (selectedAccessScope) userChoices.accessScope = selectedAccessScope.value;
        userChoices.folderPath = folderPathInput.value;
        userChoices.diskPath = diskPathInput.value;
    };

    const handleDynamicInputs = () => {
        // Show/hide "other distro" input
        distroOtherInput.classList.toggle('hidden', distroSelect.value !== 'other');
        
        // Update username placeholder
        userPlaceholder.textContent = usernameInput.value || 'your_username';
        
        // Show/hide access scope options based on security mode
        const isScopeStepRelevant = userChoices.securityMode !== 'default';
        
        // In Step 3, show/hide folder/disk path inputs
        if (currentStep === 3) {
            const scope = Array.from(accessScopeRadios).find(r => r.checked).value;
            folderPathGroup.classList.toggle('hidden', scope !== 'folder');
            diskPathGroup.classList.toggle('hidden', scope !== 'disk');

            // Auto-fill path suggestions
            if (usernameInput.value) {
                folderPathInput.placeholder = `C:\\Users\\${usernameInput.value}\\Projects`;
            }
        }
    };
    
    const generateTutorial = () => {
        const { distroName, targetDrive, username, securityMode, accessScope, folderPath, diskPath } = userChoices;

        let html = '';

        // --- 1. Migration ---
        html += `
            <h3>第一步：迁移WSL（通用）</h3>
            <p>首先，我们将你的WSL发行版迁移到新的位置。请以<strong>管理员身份</strong>运行PowerShell并执行以下命令。</p>
            <p>1. 在目标盘创建目录结构：</p>
            ${createCodeBlock('powershell', `mkdir ${targetDrive}\\wsl\nmkdir ${targetDrive}\\wsl\\${distroName}\nmkdir ${targetDrive}\\wsl_backups`)}
            <p>2. 导出现有的WSL系统（此过程可能需要一些时间）：</p>
            ${createCodeBlock('powershell', `wsl --export ${distroName} ${targetDrive}\\wsl_backups\\${distroName}.tar`)}
            <p>3. 注销原有的WSL系统（<strong>请务必确认上一步的.tar文件已成功生成！</strong>）：</p>
            ${createCodeBlock('powershell', `wsl --unregister ${distroName}`)}
            <p>4. 将系统导入到新位置：</p>
            ${createCodeBlock('powershell', `wsl --import ${distroName} ${targetDrive}\\wsl\\${distroName} ${targetDrive}\\wsl_backups\\${distroName}.tar`)}
            <p>迁移完成后，请继续执行下面的安全配置步骤。</p>
        `;
        
        // --- 2. Security Configuration ---
        html += `<h3>第二步：安全配置</h3>`;

        switch (securityMode) {
            case 'isolated':
                html += generateIsolatedModeTutorial();
                break;
            case 'partial':
                html += generatePartialModeTutorial();
                break;
            case 'default':
                html += generateDefaultModeTutorial();
                break;
        }

        tutorialOutput.innerHTML = html;
        expansionContent.innerHTML = generateExpansionTutorial();
        
        // Add copy-to-clipboard functionality to new buttons
        addCopyListeners();
    };

    const generateIsolatedModeTutorial = () => {
        const { distroName, username } = userChoices;
        let content = `
            <p>你选择了 <strong>完全隔离模式</strong>。此模式下WSL将无法访问任何Windows文件系统，除非你明确指定。
            <p>1. 编辑wsl.conf文件以关闭自动挂载。在WSL终端中运行：</p>
            ${createCodeBlock('bash', `sudo nano /etc/wsl.conf`)}
            <p>2. 将以下内容粘贴到文件中，并将 <code>your_username</code> 替换为你的 <strong>Linux用户名</strong>（通常与Windows用户名不同）：</p>
            ${createCodeBlock('ini', `[automount]\nenabled = false\n\n[user]\ndefault = ${username}`)}
            <p>3. 关闭WSL以应用配置。在PowerShell中运行：</p>
            ${createCodeBlock('powershell', 'wsl --shutdown')}
            <p>基础隔离已完成。接下来是配置访问范围：</p>
            ${generateAccessScopeTutorial()}
        `;
        return content;
    };
    
    const generatePartialModeTutorial = () => {
        const { distroName, username } = userChoices;
        let content = `
            <p>你选择了 <strong>部分挂载模式</strong>。此模式下C盘将以只读方式挂载，保护系统文件安全。</p>
            <p>1. 首先，同样需要关闭自动挂载。在WSL终端中运行 <code>sudo nano /etc/wsl.conf</code> 并粘贴以下内容 (替换Linux用户名)：</p>
            ${createCodeBlock('ini', `[automount]\nenabled = false\n\n[user]\ndefault = ${username}`)}
            <p>2. 接着，我们将以只读方式挂载C盘。编辑fstab文件：</p>
            ${createCodeBlock('bash', 'sudo nano /etc/fstab')}
            <p>3. 在文件中添加以下行：</p>
            ${createCodeBlock('', 'C: /mnt/c drvfs ro,defaults,metadata 0 0')}
            <p>4. 创建挂载点并挂载C盘：</p>
            ${createCodeBlock('bash', 'sudo mkdir -p /mnt/c\nsudo mount -a')}
            <p>C盘只读挂载已完成。接下来是配置额外的可读写访问范围：</p>
            ${generateAccessScopeTutorial()}
        `;
        return content;
    };

    const generateDefaultModeTutorial = () => {
        const { username } = userChoices;
        return `
            <p>你选择了 <strong>默认挂载模式</strong>。所有Windows磁盘都将自动挂载到WSL中。</p>
            <p>我们只需配置默认登录用户。在WSL终端中运行 <code>sudo nano /etc/wsl.conf</code> 并粘贴以下内容 (替换Linux用户名)：</p>
            ${createCodeBlock('ini', `[user]\ndefault = ${username}`)}
            <p>保存后，在PowerShell中运行 <code>wsl --shutdown</code> 重启即可。</p>
            <p><strong>配置已全部完成！</strong></p>
        `;
    };
    
    const generateAccessScopeTutorial = () => {
        const { accessScope, folderPath, diskPath, username } = userChoices;
        if (accessScope === 'folder') {
            const finalFolderPath = folderPath || `C:\\Users\\${username}\\Projects`;
            return `
                <h4>方案1：指定文件夹</h4>
                <p>你选择只挂载特定文件夹。这提供了最高的安全性。</p>
                <p>1. 编辑fstab文件：</p>
                ${createCodeBlock('bash', 'sudo nano /etc/fstab')}
                <p>2. 在文件中（如果是部分挂载，则在C盘挂载行下面）添加以下行。它会将Windows的 <code>${finalFolderPath}</code> 目录挂载到WSL的 <code>/home/${username}/projects</code>：</p>
                ${createCodeBlock('', `${finalFolderPath.replace(/\\/g, '\\\\')} /home/${username}/projects drvfs defaults,metadata 0 0`)}
                <p>3. 创建挂载点并应用：</p>
                ${createCodeBlock('bash', `sudo mkdir -p /home/${username}/projects\nsudo mount -a`)}
                <p><strong>配置完成！</strong></p>
            `;
        } else { // disk
            const finalDiskPath = diskPath || 'D:';
            return `
                <h4>方案2：指定磁盘</h4>
                <p>你选择挂载整个磁盘。这方便了文件管理。</p>
                <p>1. 编辑fstab文件：</p>
                ${createCodeBlock('bash', 'sudo nano /etc/fstab')}
                <p>2. 在文件中（如果是部分挂载，则在C盘挂载行下面）添加以下行。它会将Windows的 <code>${finalDiskPath}</code> 盘挂载到WSL的 <code>/mnt/${finalDiskPath.charAt(0).toLowerCase()}</code>：</p>
                ${createCodeBlock('', `${finalDiskPath} /mnt/${finalDiskPath.charAt(0).toLowerCase()} drvfs defaults,metadata 0 0`)}
                <p>3. 创建挂载点并应用：</p>
                ${createCodeBlock('bash', `sudo mkdir -p /mnt/${finalDiskPath.charAt(0).toLowerCase()}\nsudo mount -a`)}
                <p><strong>配置完成！</strong></p>
            `;
        }
    };
    
    const generateExpansionTutorial = () => {
        const { targetDrive, distroName } = userChoices;
        const vhdxPath = `${targetDrive}\\wsl\\${distroName}\\ext4.vhdx`;
        return `
            <p>大多数用户无需此操作。仅在默认的1TB空间不足时使用。</p>
            <h4>Windows端扩容</h4>
            <p>1. 首先彻底关闭WSL:</p>
            ${createCodeBlock('powershell', 'wsl --shutdown')}
            <p>2. 运行diskpart工具进行扩容 (例如扩容到2TB):</p>
            ${createCodeBlock('powershell', `diskpart
select vdisk file="${vhdxPath}"
expand vdisk maximum=2097152
exit`)}
            <h4>Linux端调整</h4>
            <p>重启WSL后，在WSL终端内运行以下命令使系统识别新空间：</p>
            ${createCodeBlock('bash', `sudo growpart /dev/sdb 1
sudo resize2fs /dev/sdb1`)}
            <p>最后使用 <code>df -h</code> 命令确认空间已扩大。</p>
        `;
    };
    
    const createCodeBlock = (language, code) => {
        return `<pre><code class="language-${language}">${code.trim()}</code><button class="copy-btn">复制</button></pre>`;
    };
    
    const addCopyListeners = () => {
        wizard.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pre = e.target.parentElement;
                const code = pre.querySelector('code').innerText;
                navigator.clipboard.writeText(code).then(() => {
                    btn.innerText = '已复制!';
                    setTimeout(() => { btn.innerText = '复制'; }, 2000);
                }).catch(err => {
                    console.error('无法复制: ', err);
                });
            });
        });
    };
    
    const restart = () => {
        currentStep = 1;
        // Reset userChoices to default if needed
        updateStepVisibility();
    };

    // --- Event Listeners ---
    nextButtons.forEach(button => button.addEventListener('click', navigateNext));
    prevButtons.forEach(button => button.addEventListener('click', navigatePrev));
    restartButton.addEventListener('click', restart);
    
    // Listen for changes on all relevant inputs to handle dynamic UI updates
    wizard.addEventListener('input', handleDynamicInputs);
    wizard.addEventListener('change', handleDynamicInputs);

    // --- Initial Setup ---
    updateStepVisibility();
    handleDynamicInputs(); // Initial call to set up dynamic fields correctly
});