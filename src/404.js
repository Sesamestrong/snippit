import React from "react";
import styled from "styled-components";

const BashContainer = styled.div`
	width: 50vw;
	height: 50vh;
	margin: 25vh auto 0 auto;
	background-color: #000;
	border: 1px solid #888;
	border-radius: 1em;
	padding: 1em;

	pre {
		white-space: pre;
        line-height: 1.4;
        font-size: 1.1em;
		height: 100%;
	}
`;
export const NotFound = ({ match }) => {
	console.log(window.location);
	return (
		<BashContainer>
			<pre>
				$ curl -I {window.location.toString()} {"\n\n"}
				HTTP/1.1 404 Not Found {"\n"}
				Content-Type: text/html; charset=UTF-8 {"\n"}
				Referrer-Policy: no-referrer {"\n"}
				Content-Length: 1337 {"\n"}
				Date: {new Date().toString()} {"\n\n\n"}

				&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;_  _      ___    _  _		{"\n"}
				&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;| || |    / _ \  | || |		{"\n"}
				&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;| || |_  | | | | | || |_	{"\n"}
				&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|__   _| | | | | |__   _|	{"\n"}
				&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;| |   | |_| |    | |		{"\n"}
				&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|_|    \___/     |_|		{"\n"}


			</pre>
		</BashContainer>
	);
};
