document.addEventListener('DOMContentLoaded', function () {
    const mavjudlikSelect = document.getElementById('id_mavjudlik');
    if (!mavjudlikSelect) return;

    const nusxalarRow = document.querySelector('.field-nusxalar_soni');
    // TabularInline wrapper id in Django admin is usually `fayllar-group`
    const fayllarGroup = document.getElementById('fayllar-group') || document.querySelector('.inline-group');

    function toggleFields() {
        const isBosma = mavjudlikSelect.value === 'bosma';

        if (nusxalarRow) {
            nusxalarRow.style.display = isBosma ? '' : 'none';
            const nusxalarInput = document.getElementById('id_nusxalar_soni');
            if (nusxalarInput) {
                if (isBosma) {
                    nusxalarInput.setAttribute('required', 'required');
                } else {
                    nusxalarInput.removeAttribute('required');
                }
            }
        }

        if (fayllarGroup) {
            fayllarGroup.style.display = isBosma ? 'none' : '';
        }
    }

    mavjudlikSelect.addEventListener('change', toggleFields);
    toggleFields();
});
