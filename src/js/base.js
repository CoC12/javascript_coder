document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const questionId = params.get('qid');
    const debug = params.get('debug') === 'true';

    const questionDisplayManager = new QuestionDisplayManager(debug);
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
     * @param {boolean} debug デバッグモードを有効にするかどうか
     */
    constructor(debug) {
        this.debug = debug;
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
            '.js-html': question.html,
        };
        const questionDetailNode = this.detailTemplateElement.content.cloneNode(true);
        Object.entries(mapping).forEach(([key, value]) => {
            const element = questionDetailNode.querySelector(key);
            element.innerHTML = value;
        });
        // HTMLコードのハイライト
        const htmlCodeNodeList = questionDetailNode.querySelectorAll('.language-html');
        htmlCodeNodeList.forEach((htmlCodeElement) => {
            htmlCodeElement.innerHTML = Prism.highlight(htmlCodeElement.innerHTML, Prism.languages.html, 'html');
        });
        // エディタのセットアップ
        const editor = questionDetailNode.querySelector('.js-editor');
        const result = questionDetailNode.querySelector('.js-result');
        const deploy = questionDetailNode.querySelector('.js-deploy');
        const scoreTableBody = questionDetailNode.querySelector('.js-score-table-body');
        const virtualEnv = questionDetailNode.querySelector('.js-virtual-env');
        const scoringButtonElement = questionDetailNode.querySelector('.js-scoring');
        require.config({ paths: { vs: 'js/lib/monaco-editor/vs' } });
        require(['vs/editor/editor.main'], () => {
            const monacoEditor = monaco.editor.create(
                editor,
                {
                    value: question.editorDefault,
                    language: 'javascript',
                },
            );
            // サンドボックス環境のセットアップ
            result.appendChild(this.#buildSandbox(question.html, monacoEditor.getValue()));
            deploy.addEventListener('click', () => {
                result.innerHTML = '';
                result.appendChild(this.#buildSandbox(question.html, monacoEditor.getValue()));
            });
            // 採点のセットアップ
            const testCaseModal = new TestCaseModal();
            question.testCases.forEach((testCase) => {
                const tr = document.createElement('tr');
                tr.setAttribute('data-id', testCase.id);
                tr.innerHTML = (
                    `<td>
                        <span class="js-test-case-detail text-link">
                            ${testCase.name}
                        </span>
                    </td>
                    <td class="js-score-result">-</td>`
                );
                tr.querySelector('.js-test-case-detail').addEventListener('click', () => {
                    testCaseModal.open(testCase);
                });
                scoreTableBody.appendChild(tr);
            });
            // 「採点」ボタンクリック時
            scoringButtonElement.addEventListener('click', () => {
                // 採点環境の初期化
                virtualEnv.innerHTML = '';
                // コードの採点
                question.testCases.forEach((testCase) => {
                    const tableRow = scoreTableBody.querySelector(`[data-id="${testCase.id}"]`);
                    const scoreResultElement = tableRow.querySelector('.js-score-result');
                    this.#scoreCode(
                        virtualEnv,
                        testCase,
                        question.html,
                        monacoEditor.getValue(),
                        scoreResultElement,
                    );
                });
            });
        });
        // デバッグモード用
        if (this.debug) {
            virtualEnv.style.display = 'block';
        }
        return questionDetailNode;
    }

    /**
     * サンドボックス環境を生成する。
     * @param {string} html HTML文字列
     * @param {string} script JavaScript文字列
     * @returns {HTMLIFrameElement} サンドボックス環境のiframe要素
     */
    #buildSandbox = (html, script) => {
        const sandboxBlob = new Blob(
            [html, `<script>${script}</script>`],
            { type: 'text/html' },
        );
        const sandboxBlobURL = URL.createObjectURL(sandboxBlob);
        const iframeElement = document.createElement('iframe');
        iframeElement.src = sandboxBlobURL;
        return iframeElement
    };

    /**
     * コードを採点し、結果を更新する。
     * @param {Element} virtualEnv コードの採点用の要素
     * @param {TestCase} testCase TestCase オブジェクト
     * @param {string} html HTML文字列
     * @param {string} script JavaScript文字列
     * @param {Element} scoreResultElement 採点結果を表示する要素
     */
    #scoreCode = (
        virtualEnv,
        testCase,
        html,
        script,
        scoreResultElement,
    ) => {
        const iframeElement = this.#buildSandbox(html, script);
        iframeElement.addEventListener('load', () => {
            const isAccepted = testCase.isAccepted(iframeElement.contentDocument, this.debug);
            const [styleClass, tooltipText, label] = (
                isAccepted
                    ? ['c-question-detail__score score-ac', '正解', 'AC']
                    : ['c-question-detail__score score-wa', '不正解', 'WA']
            )
            scoreResultElement.innerHTML = (
                `<span class="${styleClass} c-tooltip__target">
                    ${label}
                    <span class="c-tooltip__text">
                        ${tooltipText}
                    </span>
                </span>`
            );
        });
        virtualEnv.appendChild(iframeElement);
    };
}
