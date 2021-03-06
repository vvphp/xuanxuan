import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {classes} from '../../utils/html-helper';
import replaceViews from '../replace-views';
import MessageContentCard from './message-content-card';
import {getUrlMeta} from '../../core/ui';
import WebView from '../common/webview';
import Lang from '../../lang';
import Button from '../../components/button';

export default class MessageContentUrl extends PureComponent {
    static get MessageContentUrl() {
        return replaceViews('chats/message-content-url', MessageContentUrl);
    }

    static propTypes = {
        className: PropTypes.string,
        url: PropTypes.string.isRequired,
        data: PropTypes.object,
        sleep: PropTypes.bool,
    };

    static defaultProps = {
        className: null,
        data: null,
        sleep: false
    };

    constructor(props) {
        super(props);
        const {data, sleep} = props;
        this.state = {meta: data && data.title ? data : null, sleep};
    }

    componentDidMount() {
        this.getUrlMeta();
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.url !== this.props.url) {
            this.setState({meta: null});
        }
    }

    componentWillUnmount() {
        this.unmounted = true;
    }

    getUrlMeta(disableCache = false) {
        if (this.state.meta && !this.state.loading) {
            return;
        }
        const {url} = this.props;
        getUrlMeta(url, disableCache).then(meta => {
            if (this.unmounted) {
                return;
            }
            return this.setState({meta, loading: false});
        }).catch(_ => {
            if (this.unmounted) {
                return;
            }
            if (DEBUG) {
                console.error('Get url meta error', _);
            }
            return this.setState({meta: {url, title: url}, loading: false});
        });
    }

    tryGetUrlMeta() {
        this.setState({loading: true}, () => {
            this.getUrlMeta(true);
        });
    }

    loadSleep = () => {
        this.setState({sleep: false, loading: true}, () => {
            this.getUrlMeta(true);
        });
    };

    render() {
        const {
            url,
            className,
            data,
            sleep,
            ...other
        } = this.props;

        const {meta, loading} = this.state;

        if (this.state.sleep) {
            const card = {
                icon: 'mdi-web icon-2x text-info',
                clickable: 'title',
                url,
                title: url,
            };
            const reloadBtn = (<div className="flex-none hint--top has-padding-sm" data-hint={Lang.string('chat.message.loadCard')}><Button onClick={this.loadSleep} className="iconbutton rounded text-primary" icon="mdi-cards-playing-outline" /></div>);
            return <MessageContentCard header={reloadBtn} card={card} className={classes('app-message-content-url relative')} {...other} />;
        }

        const card = Object.assign({
            clickable: 'content',
            title: url,
        }, meta, {
            icon: (meta && !loading) ? (meta.icon === false ? null : (meta.icon || 'mdi-web icon-2x text-info')) : 'mdi-loading muted spin',
        });

        if (meta && !loading) {
            if (!card.menu) {
                card.menu = [];
            }
            const {webviewContent, content} = card;
            if (webviewContent) {
                const {originSrc, ...webviewProps} = content;
                card.content = <WebView className="relative" {...webviewProps} ref={e => {this.webview = e;}} />;
                card.clickable = 'header';
                card.menu.push({
                    label: Lang.string('common.moreActions'),
                    url: `!showContextMenu/link/?url=${encodeURIComponent(url)}`,
                    icon: 'mdi-share',
                }, {
                    label: Lang.string('ext.app.open'),
                    url: `!openUrlInDialog/${encodeURIComponent(originSrc || content.src)}/?size=lg&insertCss=${encodeURIComponent(content.insertCss)}`,
                    icon: 'mdi-open-in-app'
                });
                if (DEBUG && content.type !== 'iframe') {
                    card.menu.push({
                        label: Lang.string('ext.app.openDevTools'),
                        click: () => {
                            if (this.webview && this.webview.webview && this.webview.webview.openDevTools) {
                                this.webview.webview.openDevTools();
                            } else if (DEBUG) {
                                console.warn('Cannot open dev tools for current webview.');
                            }
                        },
                        icon: 'mdi-auto-fix'
                    });
                }
            }
            card.menu.push({
                label: Lang.string('chat.message.refreshCard'),
                click: () => {
                    if (this.webview) {
                        this.webview.reloadWebview();
                    } else {
                        this.tryGetUrlMeta();
                    }
                },
                icon: 'mdi-refresh'
            });
        }

        return <MessageContentCard card={card} className={classes('app-message-content-url relative')} {...other} />;
    }
}
