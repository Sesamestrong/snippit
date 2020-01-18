import React, { Component, useState, useEffect } from "react";
import MonacoEditor from "@uiw/react-monacoeditor";
import styled from "styled-components";

const getBlobURL = (code, type) => {
	const blob = new Blob([code], { type });
	return URL.createObjectURL(blob);
};

const CreateContainer = styled.div`
	display: flex;
	align-items: stretch;
	height: calc(100% - 4em);
`;

const TabBar = styled.div`
	display: flex;
	height: 3em;
	background-color: #111;
`;

const Container = styled.div`
	flex-basis: 70%;
	height: 100%;

	display: flex;
	flex-direction: column;
`;
const Tab = styled.div`
	height: 3em;
	padding: 1em;
	flex-shrink: 1;
	user-select: none;
	background: ${({ active }) => (active ? "#1e1e1e" : "")};
	cursor: pointer;

	&:hover {
		background-color: #333;
	}
`;
const EditorContainer = styled.div`
	flex: 1;
`;
const Editor = ({ code, setCode }) => {
	const tabs = ["javascript", "html", "css"];
	const [currentTab, setTab] = useState("javascript");
	console.log(code, currentTab);

	return (
		<Container>
			<TabBar>
				{tabs.map(tab => (
					<Tab
						active={tab === currentTab}
						onClick={() => setTab(tab)}>
						{tab}
					</Tab>
				))}
			</TabBar>
			<EditorContainer>
				<MonacoEditor
					language={currentTab}
					value={code[currentTab]}
					onChange={v => setCode(currentTab, v)}
					options={{
						automaticLayout: true,
						theme: "vs-dark"
					}}></MonacoEditor>
			</EditorContainer>
		</Container>
	);
};

const WebViewContainer = styled.div`
	flex-grow: 1;
	height: 100%;
	background-color: #444;
`;
const BrowserBar = styled.div`
	height: 2em;
	display: flex;
	box-sizing: border-box;
	padding: 0.25em;
	background-color: #666;
`;
const UrlBar = styled.input`
	flex-grow: 1;
`;
const ReloadIcon = styled.div`
	height: 1.5rem;
	width: 1.5rem;
	line-height: 1.5rem;
	text-align: center;
	font-size: 1.5em;
	user-select: none;
`;
const WebViewIframe = styled.div``;
const WebView = ({ currentUrl, setCurrentUrl }) => {
	// useEffect({})
	const updateUrl = () => setCurrentUrl(tempUrl);
	const [tempUrl, setTempUrl] = useState(currentUrl);
	return (
		<WebViewContainer>
			<BrowserBar>
				<UrlBar
					value={tempUrl}
					onChange={e => setTempUrl(e.target.value)}
					onBlur={updateUrl}></UrlBar>
				<ReloadIcon onClick={updateUrl}>&#8634;</ReloadIcon>
			</BrowserBar>
			<WebViewIframe currentUrl={currentUrl}></WebViewIframe>
		</WebViewContainer>
	);
};
export class Create extends Component {
	constructor(props) {
		super(props);
		this.state = {
			code: {
				html: "",
				javascript: "",
				css: ""
			},
			blobUrl: "",
			currentUrl: "https://www.wikipedia.com/asdf"
		};
	}

	compile = () => {};

	setCurrentUrl = currentUrl => {
		this.setState({ currentUrl });
	};
	setCode = (lang, val) => {
		this.setState(({ code }) => ({
			code: { ...code, [lang]: val },
			blobUrl: this.compile()
		}));
	};

	render() {
		const { setCurrentUrl, setCode } = this;
		const { currentUrl, code } = this.state;

		return (
			<CreateContainer>
				<WebView
					currentUrl={currentUrl}
					setCurrentUrl={setCurrentUrl}></WebView>
				<Editor code={code} setCode={setCode}></Editor>
			</CreateContainer>
		);
	}
}
