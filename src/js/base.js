document.addEventListener('DOMContentLoaded', () => {
    const questionDisplayManager = new QuestionDisplayManager();

    const params = new URLSearchParams(window.location.search);
    const questionId = params.get('qid');
    if (questionId) {
        fetch(`json/questions/${questionId}.json`).then((response) => {
            return response.json();
        }).then((result) => {
            const question = Question.fromJson(result);
            questionDisplayManager.showDetail(question);
        }).catch(() => {
            questionDisplayManager.showList();
        });
    } else {
        questionDisplayManager.showList();
    }
});


class QuestionDisplayManager {
    /**
     * コンストラクタ
     */
    constructor() {
        this.listContainerElement = document.querySelector('#id-question-list-container');
        this.listItemTemplateElement = document.querySelector('#id-template__question-list-item');
        this.detailContainerElement = document.querySelector('#id-question-detail-container');
        this.detailTemplateElement = document.querySelector('#id-template__question-detail');
    }

    /**
     * 問題一覧を表示する。
     */
    showList() {
        const listElement = this.#buildListElement();
        this.listContainerElement.appendChild(listElement);
    }

    /**
     * 問題詳細を表示する。
     * @param {Question} question Question オブジェクト
     */
    showDetail(question) {
        const detailElement = this.#buildDetailElement(question);
        this.detailContainerElement.appendChild(detailElement);
    }

    /**
     * 問題一覧を生成する。
     * @returns {HTMLDivElement} 問題一覧の HTMLDivElement オブジェクト
     */
    #buildListElement() {
        const questionListElement = document.createElement('div');
        questionListData.forEach((questionData) => {
            const listItemNode = this.listItemTemplateElement.content.cloneNode(true);
            const difficulty = listItemNode.querySelector('.js-difficulty');
            const questionContainer = listItemNode.querySelector('.js-question-container');
            difficulty.innerText = questionData.difficulty;
            questionContainer.innerHTML = questionData.questions.map((question) => {
                return `<li><a href="?qid=${question.id}">${question.label}</a></li>`
            }).join('');
            questionListElement.appendChild(listItemNode);
        });
        return questionListElement;
    }

    /**
     * 問題詳細を生成する。
     * @param {Question} question Question オブジェクト
     * @returns {Node} 問題詳細の Node オブジェクト
     */
    #buildDetailElement(question) {
        // 問題情報のセット
        const mapping = {
            '.js-id': question.id,
            '.js-title': question.title,
            '.js-text': question.textList.map(text => `<p>${text}</p>`).join(''),
            '.js-limitation': question.limitationList.map(limitation => `<li>${limitation}</li>`).join(''),
            '.js-html': Prism.highlight(question.html, Prism.languages.html, 'html'),
        };
        const questionDetailNode = this.detailTemplateElement.content.cloneNode(true);
        Object.entries(mapping).forEach(([key, value]) => {
            const element = questionDetailNode.querySelector(key);
            element.innerHTML = value;
        });
        // サンドボックス環境のセットアップ
        const result = questionDetailNode.querySelector('.js-result');
        const editor = questionDetailNode.querySelector('.js-editor');
        const deploy = questionDetailNode.querySelector('.js-deploy');
        this.#buildSandbox(question.html, editor.innerText, result);
        deploy.addEventListener('click', () => {
            this.#buildSandbox(question.html, editor.innerText, result);
        });
        // エディタのセットアップ
        require.config({ paths: { vs: 'js/lib/monaco-editor/vs' } });
        require(['vs/editor/editor.main'], () => {
            monaco.editor.create(
                editor,
                {
                    value: question.editorDefault,
                    language: 'javascript',
                },
            );
        });
        return questionDetailNode;
    }

    /**
     * サンドボックス環境を生成する。
     * @param {string} html HTML文字列
     * @param {string} script JavaScript文字列
     * @param {Element} targetElement サンドボックス環境の生成先の要素
     */
    #buildSandbox = (html, script, targetElement) => {
        const sandboxBlob = new Blob(
            [html, `<script>${script}</script>`],
            { type: 'text/html' },
        );
        const sandboxBlobURL = URL.createObjectURL(sandboxBlob);
        const iframeElement = document.createElement('iframe');
        iframeElement.src = sandboxBlobURL;

        targetElement.innerHTML = '';
        targetElement.appendChild(iframeElement);
    };
}
