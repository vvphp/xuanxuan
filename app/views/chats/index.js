import React, {Component, PropTypes} from 'react';
import {Route, Redirect} from 'react-router-dom';
import SplitPane from 'react-split-pane';
import HTML from '../../utils/html-helper';
import App from '../../core';
import {Menu} from './menu';
import {ChatsCache} from './chats-cache';
import {ChatsDndContainer} from './chats-dnd-container';
import replaceViews from '../replace-views';

/**
 * 聊天界面核心部分
 */

class Index extends Component {
    static propTypes = {
        match: PropTypes.object.isRequired,
        hidden: PropTypes.bool,
        className: PropTypes.string,
    };

    static defaultProps = {
        hidden: false,
        className: null,
    };

    static get Index() {
        return replaceViews('chats/index', Index);
    }

    render() {
        const {
            hidden,
            className,
            match
        } = this.props;
        /**
         * 当前活动的聊天UI
         */
        App.im.ui.activeChat(match.params.id);

        /**
         * SplitPane 左侧群组等联系人和聊天内容的主容器
         */
        return (<div className={HTML.classes('dock app-chats', className, {hidden})}>
            <SplitPane split="vertical" maxSize={400} minSize={200} defaultSize={200}>
                <Menu className="dock" filter={match.params.filterType} />
                <ChatsCache className="dock" filterType={match.params.filterType} chatId={match.params.id}>
                    <ChatsDndContainer className="dock" />
                </ChatsCache>
            </SplitPane>
            <Route
                path="/chats/:filterType"
                exact
                render={props => {
                    const activeChatId = App.im.ui.currentActiveChatId;
                    if (activeChatId) {
                        return <Redirect to={`${props.match.url}/${activeChatId}`} />;
                    }
                    return null;
                }}
            />
        </div>);
    }
}

export default Index;
