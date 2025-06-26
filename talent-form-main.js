const sectionsMaxScores = {
    kelembagaan: 11.5,
    infrastruktur: 8,
    akuisi: 25.45,
    pengembangan: 20,
    penempatan: 10,
    pemantauan: 5
};

document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const form = document.getElementById('maturity-assessment-form');
    const namaInstansiInput = document.getElementById('nama-instansi');

    const genericModalOverlay = document.getElementById('generic-modal-overlay');
    const genericModalTitle = document.getElementById('generic-modal-title');
    const genericModalMessage = document.getElementById('generic-modal-message');
    const genericModalCancelButton = document.getElementById('generic-modal-cancel');
    const genericModalOkButton = document.getElementById('generic-modal-ok');

    function showAlert(message, title = 'Notifikasi') {
        genericModalTitle.textContent = title;
        genericModalMessage.textContent = message;
        genericModalCancelButton.classList.add('hidden');
        genericModalOkButton.onclick = () => genericModalOverlay.classList.add('hidden');
        genericModalOverlay.classList.remove('hidden');
        console.log("Alert shown (Talent Form):", title, message);
    }

    function showConfirm(message, onConfirm, title = 'Konfirmasi') {
        genericModalTitle.textContent = title;
        genericModalMessage.textContent = message;
        genericModalCancelButton.classList.remove('hidden');

        genericModalOkButton.onclick = () => {
            genericModalOverlay.classList.add('hidden');
            onConfirm(true);
        };
        genericModalCancelButton.onclick = () => {
            genericModalOverlay.classList.add('hidden');
            onConfirm(false);
        };
        genericModalOverlay.classList.remove('hidden');
        console.log("Confirm shown (Talent Form):", title, message);
    }
    window.showAlert = showAlert; // Make global for direct calls from HTML onclick
    window.showConfirm = showConfirm; // Make global for direct calls from HTML onclick

    function showTab(tabName) {
        tabContents.forEach(content => {
            content.classList.add('hidden');
        });
        tabButtons.forEach(button => {
            button.classList.remove('text-blue-600', 'border-blue-600');
            button.classList.add('text-gray-600', 'border-transparent');
        });

        document.getElementById(`${tabName}-content`).classList.remove('hidden');
        document.querySelector(`.tab-button[data-tab="${tabName}"]`).classList.add('text-blue-600', 'border-blue-600');
    }

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            showTab(tabName);
        });
    });

    window.calculateScore = function() {
        console.log("Calculating score...");
        let totalScore = 0;
        const sectionScores = {
            kelembagaan: 0,
            infrastruktur: 0,
            akuisi: 0,
            pengembangan: 0,
            penempatan: 0,
            pemantauan: 0
        };

        const checkboxes = form.querySelectorAll('input[type="checkbox"][name="indikator"]');
        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const value = parseFloat(checkbox.value);
                const section = checkbox.dataset.section;
                if (!isNaN(value) && sectionScores[section] !== undefined) {
                    sectionScores[section] += value;
                }
            }
        });

        for (const section in sectionScores) {
            // Ensure scores don't exceed max for each section
            sectionScores[section] = Math.min(sectionScores[section], sectionsMaxScores[section]);
            document.getElementById(`score-${section}`).textContent = sectionScores[section].toFixed(2);
            totalScore += sectionScores[section];
        }

        document.getElementById('total-score').textContent = totalScore.toFixed(2);
        showAlert('Skor telah dihitung!', 'Perhitungan Selesai');
        console.log("Score calculated. Total:", totalScore.toFixed(2), "Section Scores:", sectionScores);
        return { totalScore, sectionScores }; // Return scores for saving
    };

    window.saveProgress = function() {
        console.log("Attempting to save progress...");
        const namaInstansi = namaInstansiInput.value.trim();
        if (!namaInstansi) {
            showAlert('Nama Instansi harus diisi untuk menyimpan progres.', 'Error Input');
            console.warn("Nama Instansi is empty.");
            return;
        }

        const currentScores = window.calculateScore(); // Calculate scores before saving

        const formData = {
            namaInstansi: namaInstansi,
            totalScore: currentScores.totalScore,
            sectionScores: currentScores.sectionScores, // Save individual section scores
            checkboxStates: {},
            keteranganTextareas: {},
            buktiDukungInputs: {}
        };

        // Capture all checkbox states
        const checkboxes = form.querySelectorAll('input[type="checkbox"][name="indikator"]');
        checkboxes.forEach((checkbox, index) => {
            formData.checkboxStates[index] = checkbox.checked;
        });

        // Capture all textarea values
        const textareas = form.querySelectorAll('textarea');
        textareas.forEach((textarea, index) => {
            formData.keteranganTextareas[index] = textarea.value;
        });

        // Capture all 'Input Tautan Bukti Dukung' input values
        const inputs = form.querySelectorAll('input[type="text"][placeholder="Input Tautan Bukti Dukung"]');
        inputs.forEach((input, index) => {
            formData.buktiDukungInputs[index] = input.value;
        });

        try {
            let allForms = JSON.parse(localStorage.getItem('allTalentMaturityForms')) || [];
            const existingIndex = allForms.findIndex(f => f.namaInstansi === namaInstansi);

            if (existingIndex > -1) {
                allForms[existingIndex] = formData; // Update existing
                console.log("Updating existing form data for:", namaInstansi);
            } else {
                allForms.push(formData); // Add new
                console.log("Adding new form data for:", namaInstansi);
            }

            localStorage.setItem('allTalentMaturityForms', JSON.stringify(allForms));
            showAlert('Progres Anda untuk ' + namaInstansi + ' telah disimpan!', 'Penyimpanan Berhasil');
        } catch (e) {
            console.error("Error saving progress:", e);
            showAlert('Gagal menyimpan progres. Penyimpanan lokal mungkin penuh atau tidak didukung.', 'Error Penyimpanan');
        }
    };

    window.loadFormData = function(instansiName) {
        console.log("Attempting to load form data for:", instansiName);
        try {
            const allForms = JSON.parse(localStorage.getItem('allTalentMaturityForms')) || [];
            const formData = allForms.find(f => f.namaInstansi === instansiName);

            if (formData) {
                namaInstansiInput.value = formData.namaInstansi || '';

                const checkboxes = form.querySelectorAll('input[type="checkbox"][name="indikator"]');
                checkboxes.forEach((checkbox, index) => {
                    if (formData.checkboxStates[index] !== undefined) {
                        checkbox.checked = formData.checkboxStates[index];
                    }
                });

                const textareas = form.querySelectorAll('textarea');
                textareas.forEach((textarea, index) => {
                    if (formData.keteranganTextareas[index] !== undefined) {
                        textarea.value = formData.keteranganTextareas[index];
                    }
                });

                const inputs = form.querySelectorAll('input[type="text"][placeholder="Input Tautan Bukti Dukung"]');
                inputs.forEach((input, index) => {
                    if (formData.buktiDukungInputs[index] !== undefined) {
                        input.value = formData.buktiDukungInputs[index];
                    }
                });
                window.calculateScore(); // Recalculate and display scores for the loaded form
                showAlert('Progres untuk ' + instansiName + ' telah dimuat!', 'Pemuatan Berhasil');
                console.log("Form data loaded successfully for:", instansiName);
            } else {
                showAlert('Tidak ada progres tersimpan untuk instansi tersebut.', 'Informasi');
                namaInstansiInput.value = instansiName; // Keep the requested instance name
                form.reset(); // Clear other fields
                window.calculateScore(); // Reset scores to 0
                console.log("No form data found for:", instansiName, "Resetting form.");
            }
        } catch (e) {
            console.error("Error loading progress:", e);
            showAlert('Gagal memuat progres. Data tersimpan mungkin rusak.', 'Error Pemuatan');
        }
    };

    window.exportToCsv = function() {
        console.log("Attempting to export to CSV...");
        const namaInstansi = namaInstansiInput.value.trim();
        if (!namaInstansi) {
            showAlert('Mohon isi Nama Instansi sebelum mengunduh CSV.', 'Input Diperlukan');
            console.warn("Nama Instansi is empty for CSV export.");
            return;
        }

        const headers = [
            "Nama Instansi",
            "Aspek",
            "Indikator",
            "Nilai Indikator",
            "Dicentang",
            "Keterangan Kondisi Instansi",
            "Input Tautan Bukti Dukung"
        ];
        let csvContent = headers.join(";") + "\n"; // Use semicolon as separator

        const sections = {
            "kelembagaan": "I. Kelembagaan Manajemen Talenta Instansi",
            "infrastruktur": "II. Infrastruktur Teknologi Manajemen Talenta Instansi",
            "akuisi": "III.1 Akuisisi Talenta",
            "pengembangan": "III.2 Pengembangan & III.3 Retensi Talenta",
            "penempatan": "IV. Penempatan Talenta",
            "pemantauan": "V. Pemantauan & Evaluasi"
        };

        const formElements = form.querySelectorAll('.bg-gray-50'); // Each question block
        formElements.forEach(block => {
            const sectionId = block.closest('.tab-content').id.replace('-content', '');
            const sectionName = sections[sectionId] || "Unknown Section";
            
            const questionTitleElement = block.querySelector('h3');
            let questionTitle = questionTitleElement ? questionTitleElement.textContent.trim() : "Unknown Question";

            const indikatorRows = block.querySelectorAll('.grid.grid-cols-1'); // Each indicator row
            indikatorRows.forEach(row => {
                const checkbox = row.querySelector('input[type="checkbox"][name="indikator"]');
                const indikatorTextSpan = row.querySelector('span');
                const keteranganTextarea = row.querySelector('textarea');
                const buktiDukungInput = row.querySelector('input[type="text"][placeholder="Input Tautan Bukti Dukung"]');

                if (checkbox && indikatorTextSpan) {
                    const indikator = indikatorTextSpan.textContent.trim().replace(/\s+/g, ' '); // Clean whitespace
                    const nilaiIndikator = checkbox.value;
                    const dicentang = checkbox.checked ? "YA" : "TIDAK";
                    const keterangan = keteranganTextarea ? keteranganTextarea.value.trim() : "";
                    const buktiDukung = buktiDukungInput ? buktiDukungInput.value.trim() : "";

                    const rowData = [
                        namaInstansi,
                        sectionName,
                        indikator,
                        nilaiIndikator,
                        dicentang,
                        keterangan.replace(/;/g, ",").replace(/\n/g, " "), // Replace semicolons and newlines to avoid CSV issues
                        buktiDukung.replace(/;/g, ",")
                    ].map(item => `"${item}"`); // Enclose each item in quotes

                    csvContent += rowData.join(";") + "\n";
                }
            });
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) { // feature detection
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `manajemen_talenta_${namaInstansi.replace(/\s+/g, '_')}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showAlert('Data telah diunduh sebagai CSV!', 'Unduh Berhasil');
            console.log("CSV downloaded successfully.");
        } else {
            showAlert('Peramban Anda tidak mendukung unduhan CSV.', 'Error');
            console.error("Browser does not support CSV download.");
        }
    };

    // Initial load based on URL parameter or new form
    const urlParams = new URLSearchParams(window.location.search);
    const instansiToLoad = urlParams.get('instansi');
    if (instansiToLoad) {
        window.loadFormData(instansiToLoad);
    } else {
        // Default to showing the first tab for a new blank form
        showTab('kelembagaan');
        window.calculateScore(); // Initialize scores to 0
        console.log("New form initialized.");
    }
});
