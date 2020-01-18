import React, { Component } from "react";
import styled from "styled-components";

export const AugmentedLink = styled.a`
	color: ${({ theme }) => theme.textColorBright};
    position: relative;
    text-decoration: none;
    transition: background 0.25s ease-in-out;
    padding: 5px;
    cursor: pointer;
    &:after, &:before{
		display: inline-block;
        transition: transform 0.25s ease-in-out;
    }
    &:before{
        content: "[";
        transform: translateX(-110%);
    }
    &:after{
        content: "]";
        transform: translateX(110%);
    }
    &:hover{
        background: rgba(0, 255, 0, 0.25);
        &:before{
            transform: translateX(-10%);
        }
        &:after{
            transform: translateX(10%);
        }
    }
`;
