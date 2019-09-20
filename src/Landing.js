import React from "react";
import styled, { keyframes } from "styled-components";
import { AugmentedLink } from "./Components";

const blink = keyframes`
  from, to {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
`;

const Cursor = styled.div`
	height: 1.25em;
	width: 2px;
	background-color: ${({ theme }) => theme.textColor};
	display: inline-block;
	animation: ${blink} 1s step-end infinite;
	transform: translate(4px, 9px);
`;

const LandtingTitle = styled.h1`
	color: ${({ theme }) => theme.textColor};
	margin: 2em 0em;
`;

const LandingContent = styled.div`
	width: 40vw;
`;

const LandingIllustration = styled.div`
	border-radius: 1em;
	/* box-shadow: 0px 0px 15px 1px rgba(0,0,0,0.25); */

    background-size: cover;
	background-image: url("https://flow.org/assets/featurette-bigger-1bf46c79a08d766c5e04d856bd0e3913cfc2524b8a734f3a1648e04250c7f0b3.gif");

	width: 40vw;
	height: 60vh;
	background-color: #334;
	display: flex;
	flex-wrap: wrap;
	justify-content: flex-start;
	align-items: flex-start;
	align-content: start;

	padding: 5em 1em;
	box-sizing: border-box;
	overflow: visible;

	transform: rotateY(-10deg);
	perspective: 100px;

	transform-style: preserve-3d;

	div {
		display: inline-block;
		background-color: red;
		margin: 0.25em;
		height: 1.25em;
		transition: transform 1s ease-in-out;

		&:hover {
			transform: translateZ(10px);
		}

		&.spacer {
			flex-basis: 100%;
			height: 0px;
			background-color: none;
		}

		&.indent {
		}
	}
`;
const LandingDescription = styled.p``;
const LandingPage = styled.div`
	perspective: 1000px;
	height: 90vh;
	display: flex;
	justify-content: space-evenly;
	align-items: center;
`;

const LandingActions = styled.div`
	display: flex;
	justify-content: space-evenly;
	align-items: center;
	margin: 4rem 0em;
	font-size: 1.25em;
`;
// const LandingAction = styled.a`
// color
// 	:after{
// 		content: "";
// 		display: block;
// 		position: absolute;
// 		right: 0px;
// 		left: 0px;
// 		bottom: -5px;
// 		transition: top 0.25s ease-in-out;
// 		:hover{
// 			top: -5px;
// 		}
// 	}
// `;
export const Landing = () => (
	<LandingPage>
		<LandingContent>
			<LandtingTitle>
				$ Welcome to Snippit<Cursor></Cursor>
			</LandtingTitle>
			<LandingDescription>
				Duis minim commodo fugiat sit ad consequat do amet quis. Dolore
				quis in in esse eiusmod amet. Dolore do ea duis magna nisi est
				officia duis. Consequat adipisicing adipisicing et dolore do
				consequat ullamco aliqua qui qui nostrud elit ullamco irure.
				Aute veniam ea officia non ex aliqua ex. Dolor elit fugiat id
				esse esse proident officia ipsum.
			</LandingDescription>

			<LandingActions>
				<AugmentedLink to="/new">Create Snip</AugmentedLink>
				<AugmentedLink to="/explore">Browse Snips</AugmentedLink>
			</LandingActions>
		</LandingContent>
		<LandingIllustration></LandingIllustration>
	</LandingPage>
);
