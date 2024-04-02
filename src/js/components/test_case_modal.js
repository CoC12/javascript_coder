/**
 * テストケース詳細モーダルの表示状態の管理・切り替えを管理するクラス。
 */
class TestCaseModal extends BaseModal {

    /**
     * モーダルを開き、指定したテストケース詳細を表示する。
     * @param {TestCase} testCase TestCase オブジェクト
     */
    open(testCase) {
        const testCaseModalContentTemplate = document.querySelector('#id-template__test-case-modal-content');
        const testCaseModalContentNode = testCaseModalContentTemplate.content.cloneNode(true);
        // モーダルのセットアップ
        const title = testCaseModalContentNode.querySelector('.js-title');
        const description = testCaseModalContentNode.querySelector('.js-description');
        const flow = testCaseModalContentNode.querySelector('.js-flow');
        title.textContent = testCase.name;
        description.textContent = testCase.description;
        flow.innerHTML = testCase.steps.map((step) => `<li>${step.humanize()}</li>`).join('');

        this.modalContent.appendChild(testCaseModalContentNode);
        super.open();
    }
}
