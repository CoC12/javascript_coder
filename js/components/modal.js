/**
 * モーダルの表示状態の管理・切り替えを管理するクラス。
 */
class BaseModal {

    /**
     * コンストラクタ
     */
    constructor() {
        const modalElement = document.getElementById('id-modal');
        modalElement.addEventListener('click', (e) => {
            if (e.target === this.modalElement) {
                this.close();
            };
        });

        this.bodyElement = document.body;
        this.modalElement = modalElement;
        this.modalContent = modalElement.querySelector('.js-modal__content');
    }

    /**
     * モーダルを表示する。
     */
    open() {
        this.bodyElement.classList.add('no-scroll');
        this.modalElement.style.display = 'block';
    }

    /**
     * モーダルを非表示にする。
     */
    close() {
        this.bodyElement.classList.remove('no-scroll');
        this.modalElement.style.display = 'none';
        this.modalContent.innerHTML = '';
    }
}
